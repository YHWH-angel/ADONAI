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
import { secp256k1 } from '@noble/curves/secp256k1.js';

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

// ─── Light Wallet — xpub descriptors ─────────────────────────────────────────

/** Returns wpkh descriptors for scantxoutset */
export function getDescriptors(mnemonic: string, passphrase = ''): {
  receive: string;
  change: string;
  xpub: string;
} {
  const xpub = getXpub(mnemonic, passphrase);
  return {
    receive: `wpkh(${xpub}/0/*)`,
    change: `wpkh(${xpub}/1/*)`,
    xpub,
  };
}

/** Derives key material for a specific address index */
export function deriveKeyAtIndex(
  mnemonic: string,
  index: number,
  isChange: boolean,
  passphrase = ''
): { privateKey: Uint8Array; publicKey: Uint8Array; address: string } {
  const seed = mnemonicToSeedSync(mnemonic.trim(), passphrase);
  const root = HDKey.fromMasterSeed(seed);
  const branch = isChange ? 1 : 0;
  const child = root.derive(`m/84'/0'/0'/${branch}/${index}`);

  if (!child.privateKey || !child.publicKey) throw new Error('Key derivation failed');

  const pubKeyHash = hash160(child.publicKey);
  const words = bech32.toWords(pubKeyHash);
  const address = bech32.encode(ADONAI_HRP, [0, ...words]);

  return { privateKey: child.privateKey, publicKey: child.publicKey, address };
}

// ─── Light Wallet — Transaction building (P2WPKH / BIP143) ───────────────────

const ADO_TO_SATS = 100_000_000n;

function adoToSats(ado: number): bigint {
  return BigInt(Math.round(ado * 100_000_000));
}

function writeUint32LE(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n, true);
  return b;
}

function writeUint64LE(n: bigint): Uint8Array {
  const b = new Uint8Array(8);
  const dv = new DataView(b.buffer);
  dv.setUint32(0, Number(n & 0xffffffffn), true);
  dv.setUint32(4, Number(n >> 32n), true);
  return b;
}

function writeVarInt(n: number): Uint8Array {
  if (n < 0xfd) return new Uint8Array([n]);
  if (n <= 0xffff) { const b = new Uint8Array(3); b[0] = 0xfd; new DataView(b.buffer).setUint16(1, n, true); return b; }
  const b = new Uint8Array(5); b[0] = 0xfe; new DataView(b.buffer).setUint32(1, n, true); return b;
}

function hexToBytes(hex: string): Uint8Array {
  const result = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) result[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return result;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { result.set(a, offset); offset += a.length; }
  return result;
}

function hash256(data: Uint8Array): Uint8Array {
  return sha256(sha256(data));
}

/** Build P2WPKH scriptPubKey from 20-byte pubkey hash */
function p2wpkhScript(pubKeyHash: Uint8Array): Uint8Array {
  return new Uint8Array([0x00, 0x14, ...pubKeyHash]);
}

/** BIP143 sighash for one P2WPKH input */
function bip143SigHash(
  version: number,
  inputs: Array<{ txid: string; vout: number; sequence: number; amountSats: bigint; pubKeyHash: Uint8Array }>,
  outputs: Array<{ scriptPubKey: Uint8Array; valueSats: bigint }>,
  inputIndex: number,
  locktime: number
): Uint8Array {
  const inp = inputs[inputIndex];

  // hashPrevouts
  const prevouts = concat(...inputs.map((i) => {
    const txidBytes = hexToBytes(i.txid).reverse();
    return concat(txidBytes, writeUint32LE(i.vout));
  }));
  const hashPrevouts = hash256(prevouts);

  // hashSequence
  const seqs = concat(...inputs.map((i) => writeUint32LE(i.sequence)));
  const hashSequence = hash256(seqs);

  // hashOutputs
  const outs = concat(...outputs.map((o) => concat(
    writeUint64LE(o.valueSats),
    writeVarInt(o.scriptPubKey.length),
    o.scriptPubKey
  )));
  const hashOutputs = hash256(outs);

  // scriptCode for P2WPKH: OP_DUP OP_HASH160 <20 bytes> OP_EQUALVERIFY OP_CHECKSIG
  const scriptCode = new Uint8Array([
    0x19, // length of scriptCode (25 bytes)
    0x76, 0xa9, 0x14, ...inp.pubKeyHash, 0x88, 0xac,
  ]);

  const preimage = concat(
    writeUint32LE(version),
    hashPrevouts,
    hashSequence,
    hexToBytes(inp.txid).reverse(),
    writeUint32LE(inp.vout),
    scriptCode,
    writeUint64LE(inp.amountSats),
    writeUint32LE(inp.sequence),
    hashOutputs,
    writeUint32LE(locktime),
    writeUint32LE(1), // SIGHASH_ALL
  );

  return hash256(preimage);
}

export interface LightUTXO {
  txid: string;
  vout: number;
  amountAdo: number;
  scriptPubKey: string;
  /** Derivation: isChange (0=receive,1=change) and index from scantxoutset desc */
  isChange: boolean;
  index: number;
}

/** Parse derivation info from scantxoutset desc field.
 *  e.g. "wpkh(xpub.../0/5)#checksum"  → { isChange: false, index: 5 }
 */
export function parseDescPath(desc: string): { isChange: boolean; index: number } | null {
  const m = desc.match(/\/(\d+)\/(\d+)\)/);
  if (!m) return null;
  return { isChange: m[1] === '1', index: parseInt(m[2], 10) };
}

export interface BuildTxParams {
  utxos: LightUTXO[];           // inputs to spend
  recipientAddress: string;     // destination bech32 address
  amountAdo: number;            // amount to send
  changeAddress: string;        // where to send change
  feeAdo: number;               // fee in ADO
  mnemonic: string;
  passphrase?: string;
}

/**
 * Build, sign, and return a P2WPKH segwit transaction hex.
 * All signing is done client-side; private keys never leave the browser.
 */
export function buildAndSignTx(params: BuildTxParams): string {
  const { utxos, recipientAddress, amountAdo, changeAddress, feeAdo, mnemonic, passphrase = '' } = params;

  const amountSats = adoToSats(amountAdo);
  const feeSats = adoToSats(feeAdo);
  const totalIn = utxos.reduce((s, u) => s + adoToSats(u.amountAdo), 0n);
  const changeSats = totalIn - amountSats - feeSats;

  if (changeSats < 0n) throw new Error('Insufficient funds');

  // Decode recipient address pubkey hash
  const recipientHash = bech32.decodeToBytes(recipientAddress).bytes.slice(1); // strip witness version
  const changeHash = bech32.decodeToBytes(changeAddress).bytes.slice(1);

  const recipientScript = p2wpkhScript(new Uint8Array(recipientHash));
  const changeScript = p2wpkhScript(new Uint8Array(changeHash));

  // Derive keys for each input
  const keys = utxos.map((u) => deriveKeyAtIndex(mnemonic, u.index, u.isChange, passphrase));

  // Build input descriptors for sighash
  const inputs = utxos.map((u, i) => {
    const pubKeyHash = hash160(keys[i].publicKey);
    return {
      txid: u.txid,
      vout: u.vout,
      sequence: 0xfffffffd, // RBF
      amountSats: adoToSats(u.amountAdo),
      pubKeyHash,
    };
  });

  const outputs: Array<{ scriptPubKey: Uint8Array; valueSats: bigint }> = [
    { scriptPubKey: recipientScript, valueSats: amountSats },
  ];
  if (changeSats > 546n) {
    outputs.push({ scriptPubKey: changeScript, valueSats: changeSats });
  }

  const VERSION = 2;
  const LOCKTIME = 0;

  // Sign each input
  const witnesses: Uint8Array[][] = inputs.map((_, i) => {
    const sigHash = bip143SigHash(VERSION, inputs, outputs, i, LOCKTIME);
    const derSig = secp256k1.sign(sigHash, keys[i].privateKey, { lowS: true, format: 'der' });
    const sigWithType = new Uint8Array([...derSig, 0x01]); // SIGHASH_ALL
    return [sigWithType, keys[i].publicKey];
  });

  // Serialize segwit transaction
  const txParts: Uint8Array[] = [
    writeUint32LE(VERSION),
    new Uint8Array([0x00, 0x01]), // marker + flag (segwit)
    writeVarInt(inputs.length),
  ];

  for (const inp of inputs) {
    txParts.push(hexToBytes(inp.txid).reverse()); // txid LE
    txParts.push(writeUint32LE(inp.vout));
    txParts.push(new Uint8Array([0x00])); // scriptSig empty (segwit)
    txParts.push(writeUint32LE(inp.sequence));
  }

  txParts.push(writeVarInt(outputs.length));
  for (const out of outputs) {
    txParts.push(writeUint64LE(out.valueSats));
    txParts.push(writeVarInt(out.scriptPubKey.length));
    txParts.push(out.scriptPubKey);
  }

  // Witness data
  for (const witness of witnesses) {
    txParts.push(writeVarInt(witness.length));
    for (const item of witness) {
      txParts.push(writeVarInt(item.length));
      txParts.push(item);
    }
  }

  txParts.push(writeUint32LE(LOCKTIME));

  return bytesToHex(concat(...txParts));
}

/** Estimate fee for a typical 1-in/2-out P2WPKH tx */
export function estimateLightFee(
  alpha: number,
  beta: number,
  minFee: number,
  amountAdo: number,
  numInputs = 1
): number {
  // vsize = 10.5 + 41*inputs + 31*outputs  (segwit P2WPKH, 2 outputs)
  const vsizeBytes = 10.5 + 41 * numInputs + 31 * 2;
  const vsizeKb = vsizeBytes / 1000;
  return Math.max(minFee, alpha * vsizeKb + beta * amountAdo);
}
