'use client';

/**
 * ADONAI HD Wallet Core
 *
 * Client-side key management using BIP39 mnemonics and BIP32 HD derivation.
 * Private keys NEVER leave the browser.
 *
 * Derivation path: m/84'/0'/0'/0/index  (P2WPKH — native segwit)
 * Note: ADONAI uses bech32 addresses with HRP "ad" (like Bitcoin's "bc")
 */

import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { BIP32Factory } from 'bip32';

// ADONAI network definition
export const ADONAI_NETWORK: bitcoin.Network = {
  messagePrefix: '\x18ADONAI Signed Message:\n',
  bech32: 'ad',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 23,   // addresses start with 'A'
  scriptHash: 83,
  wif: 153,
};

// ─── Mnemonic ─────────────────────────────────────────────────────────────────

export function generateMnemonic(wordCount: 12 | 24 = 24): string {
  const strength = wordCount === 12 ? 128 : 256;
  return bip39.generateMnemonic(strength);
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic.trim().toLowerCase());
}

// ─── Key Derivation ───────────────────────────────────────────────────────────

export async function mnemonicToRoot(mnemonic: string, passphrase = '') {
  bitcoin.initEccLib(ecc);
  const bip32 = BIP32Factory(ecc);
  const seed = await bip39.mnemonicToSeed(mnemonic.trim(), passphrase);
  return bip32.fromSeed(seed, ADONAI_NETWORK);
}

export async function deriveAddress(
  mnemonic: string,
  index: number,
  passphrase = ''
): Promise<{ address: string; publicKey: Buffer; path: string }> {
  const root = await mnemonicToRoot(mnemonic, passphrase);
  const path = `m/84'/0'/0'/0/${index}`;
  const child = root.derivePath(path);

  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(child.publicKey),
    network: ADONAI_NETWORK,
  });

  if (!address) throw new Error('Failed to derive address');

  return { address, publicKey: Buffer.from(child.publicKey), path };
}

export async function deriveKeyPair(
  mnemonic: string,
  index: number,
  passphrase = ''
): Promise<{ address: string; privateKey: Buffer; publicKey: Buffer; path: string }> {
  const root = await mnemonicToRoot(mnemonic, passphrase);
  const path = `m/84'/0'/0'/0/${index}`;
  const child = root.derivePath(path);

  if (!child.privateKey) throw new Error('Failed to derive private key');

  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(child.publicKey),
    network: ADONAI_NETWORK,
  });

  if (!address) throw new Error('Failed to derive address');

  return {
    address,
    privateKey: Buffer.from(child.privateKey),
    publicKey: Buffer.from(child.publicKey),
    path,
  };
}

// ─── Transaction Signing ──────────────────────────────────────────────────────

export interface Utxo {
  txid: string;
  vout: number;
  value: number; // in satoshis
  address: string;
  derivationIndex: number;
}

export interface BuildTxParams {
  mnemonic: string;
  passphrase?: string;
  utxos: Utxo[];
  recipientAddress: string;
  amountSats: number;
  feeSats: number;
  changeAddress: string;
}

export async function buildAndSignTx(params: BuildTxParams): Promise<string> {
  bitcoin.initEccLib(ecc);
  const {
    mnemonic,
    passphrase = '',
    utxos,
    recipientAddress,
    amountSats,
    feeSats,
    changeAddress,
  } = params;

  const psbt = new bitcoin.Psbt({ network: ADONAI_NETWORK });

  // Add inputs
  for (const utxo of utxos) {
    const keyPair = await deriveKeyPair(mnemonic, utxo.derivationIndex, passphrase);

    const payment = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network: ADONAI_NETWORK,
    });

    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: payment.output!,
        value: utxo.value,
      },
    });
  }

  // Add recipient output
  psbt.addOutput({
    address: recipientAddress,
    value: amountSats,
  });

  // Add change output if needed
  const totalIn = utxos.reduce((s, u) => s + u.value, 0);
  const change = totalIn - amountSats - feeSats;
  if (change > 546) {
    // above dust threshold
    psbt.addOutput({ address: changeAddress, value: change });
  }

  // Sign all inputs
  for (let i = 0; i < utxos.length; i++) {
    const utxo = utxos[i];
    const keyPair = await deriveKeyPair(mnemonic, utxo.derivationIndex, passphrase);

    const signer = {
      publicKey: keyPair.publicKey,
      sign: (hash: Buffer) => Buffer.from(ecc.sign(hash, keyPair.privateKey)),
    };

    psbt.signInput(i, signer);
  }

  psbt.finalizeAllInputs();
  return psbt.extractTransaction().toHex();
}

// ─── Encryption (AES-GCM via Web Crypto) ─────────────────────────────────────

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 250_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMnemonic(mnemonic: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(mnemonic)
  );

  // Pack: salt(16) + iv(12) + ciphertext
  const result = new Uint8Array(16 + 12 + ciphertext.byteLength);
  result.set(salt, 0);
  result.set(iv, 16);
  result.set(new Uint8Array(ciphertext), 28);

  return btoa(String.fromCharCode(...result));
}

export async function decryptMnemonic(encrypted: string, password: string): Promise<string> {
  const data = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ciphertext = data.slice(28);

  const key = await deriveKey(password, salt);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

// ─── Address to descriptor (for node import) ─────────────────────────────────

export async function getDescriptorForRange(
  mnemonic: string,
  startIndex: number,
  endIndex: number,
  passphrase = ''
): Promise<string> {
  bitcoin.initEccLib(ecc);
  const bip32 = BIP32Factory(ecc);
  const seed = await bip39.mnemonicToSeed(mnemonic.trim(), passphrase);
  const root = bip32.fromSeed(seed, ADONAI_NETWORK);
  const account = root.derivePath("m/84'/0'/0'");
  const xpub = account.neutered().toBase58();
  return `wpkh([${root.fingerprint.toString('hex')}/84'/0'/0']${xpub}/0/*)`;
}
