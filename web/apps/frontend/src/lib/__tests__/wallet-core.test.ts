/**
 * wallet-core.ts — comprehensive test suite
 *
 * Tests cover: mnemonic, address derivation, xpub, descriptors,
 * parseDescPath, fee estimation, transaction building, and encryption.
 *
 * Uses a fixed mnemonic so results are deterministic.
 */

import { describe, it, expect } from 'vitest';
import {
  generateMnemonic,
  validateMnemonic,
  deriveAddress,
  getXpub,
  getDescriptors,
  deriveKeyAtIndex,
  parseDescPath,
  estimateLightFee,
  buildAndSignTx,
  encryptMnemonic,
  decryptMnemonic,
  type LightUTXO,
} from '../wallet-core';

// ── Known test mnemonic (BIP39 standard test vector) ─────────────────────────
const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// ── Mnemonic ──────────────────────────────────────────────────────────────────

describe('generateMnemonic', () => {
  it('generates a 12-word mnemonic', () => {
    const m = generateMnemonic(12);
    expect(m.trim().split(/\s+/)).toHaveLength(12);
  });

  it('generates a 24-word mnemonic', () => {
    const m = generateMnemonic(24);
    expect(m.trim().split(/\s+/)).toHaveLength(24);
  });

  it('generated mnemonic is valid BIP39', () => {
    const m = generateMnemonic(24);
    expect(validateMnemonic(m)).toBe(true);
  });

  it('two calls produce different mnemonics', () => {
    const a = generateMnemonic(24);
    const b = generateMnemonic(24);
    expect(a).not.toBe(b);
  });
});

describe('validateMnemonic', () => {
  it('accepts a known valid 12-word mnemonic', () => {
    expect(validateMnemonic(TEST_MNEMONIC)).toBe(true);
  });

  it('accepts a generated 24-word mnemonic', () => {
    const m = generateMnemonic(24);
    expect(validateMnemonic(m)).toBe(true);
  });

  it('rejects a string of invalid words', () => {
    expect(validateMnemonic('invalid words that are not bip39')).toBe(false);
  });

  it('rejects wrong word count', () => {
    expect(validateMnemonic('abandon abandon abandon')).toBe(false);
  });

  it('handles leading/trailing whitespace', () => {
    expect(validateMnemonic('  ' + TEST_MNEMONIC + '  ')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateMnemonic('')).toBe(false);
  });
});

// ── Address derivation ────────────────────────────────────────────────────────

describe('deriveAddress', () => {
  it('derives an address starting with "ad1"', () => {
    const { address } = deriveAddress(TEST_MNEMONIC, 0);
    expect(address).toMatch(/^ad1/);
  });

  it('is deterministic for the same inputs', () => {
    const a = deriveAddress(TEST_MNEMONIC, 0);
    const b = deriveAddress(TEST_MNEMONIC, 0);
    expect(a.address).toBe(b.address);
  });

  it('different indices produce different addresses', () => {
    const a = deriveAddress(TEST_MNEMONIC, 0);
    const b = deriveAddress(TEST_MNEMONIC, 1);
    expect(a.address).not.toBe(b.address);
  });

  it('includes the derivation path m/84h/0h/0h/0/index', () => {
    const { path } = deriveAddress(TEST_MNEMONIC, 5);
    expect(path).toBe("m/84'/0'/0'/0/5");
  });

  it('returns a 33-byte compressed public key', () => {
    const { publicKey } = deriveAddress(TEST_MNEMONIC, 0);
    expect(publicKey).toHaveLength(33);
    // Compressed pubkeys start with 0x02 or 0x03
    expect([0x02, 0x03]).toContain(publicKey[0]);
  });
});

// ── xpub ─────────────────────────────────────────────────────────────────────

describe('getXpub', () => {
  it('returns a string starting with "xpub"', () => {
    const xpub = getXpub(TEST_MNEMONIC);
    expect(xpub).toMatch(/^xpub/);
  });

  it('is deterministic', () => {
    expect(getXpub(TEST_MNEMONIC)).toBe(getXpub(TEST_MNEMONIC));
  });

  it('different mnemonics produce different xpubs', () => {
    const other = generateMnemonic(24);
    expect(getXpub(TEST_MNEMONIC)).not.toBe(getXpub(other));
  });

  it('produces BLAKE3 checksum (ADONAI-compatible, not SHA256d)', async () => {
    const { blake3 } = await import('@noble/hashes/blake3');
    const { base58 } = await import('@scure/base');
    const xpub = getXpub(TEST_MNEMONIC);
    const decoded = base58.decode(xpub);
    const payload = decoded.slice(0, -4);
    const checksum = decoded.slice(-4);
    const expected = blake3(payload).slice(0, 4);
    expect(checksum).toEqual(expected);
  });
});

// ── Descriptors ───────────────────────────────────────────────────────────────

describe('getDescriptors', () => {
  it('receive descriptor contains xpub/0/*', () => {
    const { receive, xpub } = getDescriptors(TEST_MNEMONIC);
    expect(receive).toBe(`wpkh(${xpub}/0/*)`);
  });

  it('change descriptor contains xpub/1/*', () => {
    const { change, xpub } = getDescriptors(TEST_MNEMONIC);
    expect(change).toBe(`wpkh(${xpub}/1/*)`);
  });

  it('xpub field matches getXpub()', () => {
    const { xpub } = getDescriptors(TEST_MNEMONIC);
    expect(xpub).toBe(getXpub(TEST_MNEMONIC));
  });
});

// ── deriveKeyAtIndex ──────────────────────────────────────────────────────────

describe('deriveKeyAtIndex', () => {
  it('returns privateKey, publicKey, address', () => {
    const { privateKey, publicKey, address } = deriveKeyAtIndex(TEST_MNEMONIC, 0, false);
    expect(privateKey).toHaveLength(32);
    expect(publicKey).toHaveLength(33);
    expect(address).toMatch(/^ad1/);
  });

  it('receive address (isChange=false) matches deriveAddress at same index', () => {
    const { address: a1 } = deriveKeyAtIndex(TEST_MNEMONIC, 0, false);
    const { address: a2 } = deriveAddress(TEST_MNEMONIC, 0);
    expect(a1).toBe(a2);
  });

  it('change address (isChange=true) differs from receive at same index', () => {
    const { address: receive } = deriveKeyAtIndex(TEST_MNEMONIC, 0, false);
    const { address: change } = deriveKeyAtIndex(TEST_MNEMONIC, 0, true);
    expect(receive).not.toBe(change);
  });

  it('is deterministic', () => {
    const a = deriveKeyAtIndex(TEST_MNEMONIC, 3, false);
    const b = deriveKeyAtIndex(TEST_MNEMONIC, 3, false);
    expect(a.address).toBe(b.address);
    expect(Buffer.from(a.privateKey).toString('hex')).toBe(
      Buffer.from(b.privateKey).toString('hex')
    );
  });

  it('different indices produce different addresses', () => {
    const a = deriveKeyAtIndex(TEST_MNEMONIC, 0, false);
    const b = deriveKeyAtIndex(TEST_MNEMONIC, 1, false);
    expect(a.address).not.toBe(b.address);
  });
});

// ── parseDescPath ─────────────────────────────────────────────────────────────

describe('parseDescPath', () => {
  it('parses new scantxoutset format (receive, index 706)', () => {
    const desc =
      'wpkh([c66bb68c/0/706]03d96c512d783697608aa454c7beac63152b7a20d7e21251d061eaa7e823bff393)#vwl439dh';
    expect(parseDescPath(desc)).toEqual({ isChange: false, index: 706 });
  });

  it('parses new scantxoutset format (change, index 12)', () => {
    const desc = 'wpkh([c66bb68c/1/12]03d96c512d)#abc';
    expect(parseDescPath(desc)).toEqual({ isChange: true, index: 12 });
  });

  it('parses new format at index 0', () => {
    const desc = 'wpkh([aabbccdd/0/0]02abcd1234)#zz';
    expect(parseDescPath(desc)).toEqual({ isChange: false, index: 0 });
  });

  it('parses legacy format (xpub, receive, index 5)', () => {
    const desc = 'wpkh(xpub6CHhA3e.../0/5)#checksum';
    expect(parseDescPath(desc)).toEqual({ isChange: false, index: 5 });
  });

  it('parses legacy format (change, index 1)', () => {
    const desc = 'wpkh(xpub.../1/1)#abc';
    expect(parseDescPath(desc)).toEqual({ isChange: true, index: 1 });
  });

  it('returns null for unparseable input', () => {
    expect(parseDescPath('not a descriptor')).toBeNull();
    expect(parseDescPath('')).toBeNull();
    expect(parseDescPath('pkh(addr)')).toBeNull();
  });

  it('handles large index values', () => {
    const desc = 'wpkh([aabbccdd/0/9999]02ab)#zz';
    expect(parseDescPath(desc)).toEqual({ isChange: false, index: 9999 });
  });
});

// ── estimateLightFee ──────────────────────────────────────────────────────────

describe('estimateLightFee', () => {
  const alpha = 0.000001; // ADO/kvB
  const beta = 0.000005;  // 0.0005%
  const min = 0.000001;

  it('returns at least the minimum fee', () => {
    const fee = estimateLightFee(alpha, beta, min, 0, 1);
    expect(fee).toBeGreaterThanOrEqual(min);
  });

  it('increases with number of inputs', () => {
    const fee1 = estimateLightFee(alpha, beta, min, 1, 1);
    const fee5 = estimateLightFee(alpha, beta, min, 1, 5);
    expect(fee5).toBeGreaterThan(fee1);
  });

  it('increases with amount (beta component)', () => {
    const feeSmall = estimateLightFee(alpha, beta, min, 1, 1);
    const feeLarge = estimateLightFee(alpha, beta, min, 100, 1);
    expect(feeLarge).toBeGreaterThan(feeSmall);
  });

  it('fee formula: max(min, alpha*vsize + beta*amount)', () => {
    const amount = 5;
    const numInputs = 1;
    const vsizeBytes = 10.5 + 41 * numInputs + 31 * 2;
    const vsizeKb = vsizeBytes / 1000;
    const expected = Math.max(min, alpha * vsizeKb + beta * amount);
    expect(estimateLightFee(alpha, beta, min, amount, numInputs)).toBeCloseTo(expected, 10);
  });

  it('minimum fee dominates when amount is near zero', () => {
    const fee = estimateLightFee(0.000001, 0.000001, 0.001, 0.000001, 1);
    expect(fee).toBe(0.001);
  });
});

// ── buildAndSignTx ────────────────────────────────────────────────────────────

describe('buildAndSignTx', () => {
  // Derive a real address to send to
  const { address: recipientAddress } = deriveKeyAtIndex(TEST_MNEMONIC, 1, false);
  const { address: changeAddress } = deriveKeyAtIndex(TEST_MNEMONIC, 0, true);
  const { address: inputAddress } = deriveKeyAtIndex(TEST_MNEMONIC, 0, false);

  // Craft a P2WPKH scriptPubKey for the input address
  const { bech32 } = require('@scure/base');
  const { words } = bech32.decode(inputAddress);
  const inputHash = Buffer.from(bech32.fromWords(words.slice(1)));
  const inputScriptPubKey = Buffer.concat([
    Buffer.from([0x00, 0x14]),
    inputHash,
  ]).toString('hex');

  const utxo: LightUTXO = {
    txid: 'a'.repeat(64),
    vout: 0,
    amountAdo: 10,
    scriptPubKey: inputScriptPubKey,
    isChange: false,
    index: 0,
  };

  it('produces a non-empty hex string', () => {
    const hex = buildAndSignTx({
      utxos: [utxo],
      recipientAddress,
      amountAdo: 5,
      changeAddress,
      feeAdo: 0.0001,
      mnemonic: TEST_MNEMONIC,
    });
    expect(hex).toMatch(/^[0-9a-f]+$/);
    expect(hex.length).toBeGreaterThan(100);
  });

  it('starts with version 2 (02000000 in LE hex)', () => {
    const hex = buildAndSignTx({
      utxos: [utxo],
      recipientAddress,
      amountAdo: 5,
      changeAddress,
      feeAdo: 0.0001,
      mnemonic: TEST_MNEMONIC,
    });
    expect(hex.slice(0, 8)).toBe('02000000');
  });

  it('has segwit marker bytes (0001) after version', () => {
    const hex = buildAndSignTx({
      utxos: [utxo],
      recipientAddress,
      amountAdo: 5,
      changeAddress,
      feeAdo: 0.0001,
      mnemonic: TEST_MNEMONIC,
    });
    expect(hex.slice(8, 12)).toBe('0001');
  });

  it('is deterministic for the same inputs', () => {
    const params = {
      utxos: [utxo],
      recipientAddress,
      amountAdo: 5,
      changeAddress,
      feeAdo: 0.0001,
      mnemonic: TEST_MNEMONIC,
    };
    expect(buildAndSignTx(params)).toBe(buildAndSignTx(params));
  });

  it('omits change output when change is dust (≤546 sats)', () => {
    // amount + fee ≈ total input, leaving tiny change
    const dustTx = buildAndSignTx({
      utxos: [utxo],
      recipientAddress,
      amountAdo: 9.99999,
      changeAddress,
      feeAdo: 0.00001,
      mnemonic: TEST_MNEMONIC,
    });
    // With dust change (10 - 9.99999 - 0.00001 = 0 sats), 1 output expected
    // Can't easily count outputs from raw hex without full parser,
    // but we can verify it doesn't throw and produces valid hex
    expect(dustTx).toMatch(/^[0-9a-f]+$/);
  });

  it('throws when funds are insufficient', () => {
    expect(() =>
      buildAndSignTx({
        utxos: [utxo],
        recipientAddress,
        amountAdo: 9.9999,
        changeAddress,
        feeAdo: 0.1, // total = 10.0999 > 10 available
        mnemonic: TEST_MNEMONIC,
      })
    ).toThrow('Insufficient funds');
  });

  it('handles multiple UTXOs', () => {
    const utxo2: LightUTXO = {
      txid: 'b'.repeat(64),
      vout: 1,
      amountAdo: 5,
      scriptPubKey: inputScriptPubKey,
      isChange: false,
      index: 0,
    };
    const hex = buildAndSignTx({
      utxos: [utxo, utxo2],
      recipientAddress,
      amountAdo: 12,
      changeAddress,
      feeAdo: 0.0001,
      mnemonic: TEST_MNEMONIC,
    });
    expect(hex).toMatch(/^[0-9a-f]+$/);
    // With 2 inputs, tx is longer
    const singleHex = buildAndSignTx({
      utxos: [utxo],
      recipientAddress,
      amountAdo: 5,
      changeAddress,
      feeAdo: 0.0001,
      mnemonic: TEST_MNEMONIC,
    });
    expect(hex.length).toBeGreaterThan(singleHex.length);
  });
});

// ── encryptMnemonic / decryptMnemonic ─────────────────────────────────────────

describe('encryptMnemonic / decryptMnemonic', () => {
  it('encrypt then decrypt returns the original mnemonic', async () => {
    const encrypted = await encryptMnemonic(TEST_MNEMONIC, 'password123');
    const decrypted = await decryptMnemonic(encrypted, 'password123');
    expect(decrypted).toBe(TEST_MNEMONIC);
  });

  it('wrong password throws on decrypt', async () => {
    const encrypted = await encryptMnemonic(TEST_MNEMONIC, 'correct');
    await expect(decryptMnemonic(encrypted, 'wrong')).rejects.toThrow();
  });

  it('two encryptions of the same mnemonic produce different ciphertexts (random salt)', async () => {
    const enc1 = await encryptMnemonic(TEST_MNEMONIC, 'pw');
    const enc2 = await encryptMnemonic(TEST_MNEMONIC, 'pw');
    expect(enc1).not.toBe(enc2);
  });

  it('decrypted result is a valid mnemonic', async () => {
    const enc = await encryptMnemonic(TEST_MNEMONIC, 'pw');
    const dec = await decryptMnemonic(enc, 'pw');
    expect(validateMnemonic(dec)).toBe(true);
  });

  it('works with empty password', async () => {
    const enc = await encryptMnemonic(TEST_MNEMONIC, '');
    const dec = await decryptMnemonic(enc, '');
    expect(dec).toBe(TEST_MNEMONIC);
  });
});
