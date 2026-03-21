'use client';

/**
 * ADONAI HD Wallet Core — pure TypeScript, no WebAssembly
 *
 * BIP39 mnemonics + BIP32 HD derivation using @scure libraries.
 * Private keys NEVER leave the browser.
 *
 * Derivation path: m/84'/0'/0'/0/index  (P2WPKH — native segwit)
 * ADONAI bech32 HRP: "ad"
 */

import { generateMnemonic as scureGenerate, validateMnemonic as scureValidate, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { bech32 } from '@scure/base';

const ADONAI_HRP = 'ad';

// ─── Mnemonic ─────────────────────────────────────────────────────────────────

export function generateMnemonic(wordCount: 12 | 24 = 24): string {
  const strength = wordCount === 12 ? 128 : 256;
  return scureGenerate(wordlist, strength);
}

export function validateMnemonic(mnemonic: string): boolean {
  return scureValidate(mnemonic.trim(), wordlist);
}

// ─── Address Derivation ───────────────────────────────────────────────────────

function hash160(data: Uint8Array): Uint8Array {
  return ripemd160(sha256(data));
}

export function deriveAddress(
  mnemonic: string,
  index: number,
  passphrase = ''
): { address: string; publicKey: Uint8Array; path: string } {
  const seed = mnemonicToSeedSync(mnemonic.trim(), passphrase);
  const root = HDKey.fromMasterSeed(seed);
  const path = `m/84'/0'/0'/0/${index}`;
  const child = root.derive(path);

  if (!child.publicKey) throw new Error('Failed to derive public key');

  // P2WPKH: bech32( HRP, [witnessVersion=0, ...toWords(hash160(pubkey))] )
  const pubKeyHash = hash160(child.publicKey);
  const words = bech32.toWords(pubKeyHash);
  const address = bech32.encode(ADONAI_HRP, [0, ...words]);

  return { address, publicKey: child.publicKey, path };
}

export function getXpub(mnemonic: string, passphrase = ''): string {
  const seed = mnemonicToSeedSync(mnemonic.trim(), passphrase);
  const root = HDKey.fromMasterSeed(seed);
  const account = root.derive("m/84'/0'/0'");
  return account.publicExtendedKey;
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
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: 250_000, hash: 'SHA-256' },
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

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(mnemonic)
  );

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
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}
