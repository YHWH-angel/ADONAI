# Exporting and Importing Wallet Descriptors

Descriptors describe the keys and scripts used by a wallet. Adonai can export and import these descriptors for backup or migration.

## Export from the GUI

1. Open the wallet and choose **File -> Export Descriptors…**.
2. Pick a destination file. A JSON document with the wallet's active descriptors is written. If the wallet holds private keys, the file will contain the corresponding extended private keys, so store it securely.

## Import in the GUI

1. Choose **File -> Import Descriptors…**.
2. Select a JSON file containing an array of descriptors as produced by the export step or by the `listdescriptors` RPC.
3. The wallet will report whether each descriptor was imported successfully and rescan the blockchain if needed to discover existing transactions.

## Command Line

Use RPC calls:

- Export: `bitcoin-cli -rpcwallet=<name> listdescriptors true > descriptors.json`
- Import: `bitcoin-cli -rpcwallet=<name> importdescriptors "$(cat descriptors.json)"`

These commands allow moving descriptor-based wallets between nodes or creating backups without exposing private keys if `listdescriptors` is called without the `true` argument.
