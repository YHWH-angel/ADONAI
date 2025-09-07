# Restoring a Wallet from a Seed

Adonai wallets can be recreated from a BIP39 mnemonic seed without storing the mnemonic on disk. The GUI and RPC interfaces allow reconstructing descriptor wallets from these phrases. Restored wallets use the derivation path `m/84'/5353'/0'` and a default gap limit of 20 addresses.

## GUI

1. Choose **File -> Restore from seed…**.
2. Enter your 12- or 24-word seed. Optionally, provide the BIP39 passphrase.
3. Select the derivation preset or enter a custom derivation path.
4. (Recommended) Enable blockchain rescan and choose the block height to start from. If you skip this step, funds sent to the wallet before restoration may be missing and you will be prompted to confirm continuing without a rescan.
5. Click **Restore** and monitor the progress dialog as blocks are scanned until the rescan completes.

The mnemonic and derived seed are wiped from memory once the wallet is created.

## RPC

Use the `createwalletfrommnemonic` RPC:

```
createwalletfrommnemonic "wallet_name" "mnemonic" "passphrase" "m/84'/5353'/0'" rescan_height
```

The call returns the wallet fingerprint and preview addresses. The mnemonic is never written to disk.
