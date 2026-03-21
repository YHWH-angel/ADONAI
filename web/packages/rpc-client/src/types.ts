// ─── Core RPC Types ───────────────────────────────────────────────────────────

export interface RpcConfig {
  url: string;
  username: string;
  password: string;
  walletName?: string;
}

export interface RpcRequest {
  jsonrpc: '1.0';
  id: string | number;
  method: string;
  params: unknown[];
}

export interface RpcResponse<T = unknown> {
  result: T;
  error: RpcError | null;
  id: string | number;
}

export interface RpcError {
  code: number;
  message: string;
}

// ─── Blockchain Types ─────────────────────────────────────────────────────────

export interface BlockchainInfo {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  time: number;
  mediantime: number;
  verificationprogress: number;
  chainwork: string;
  pruned: boolean;
  warnings: string | string[];
}

export interface Block {
  hash: string;
  confirmations: number;
  height: number;
  version: number;
  merkleroot: string;
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  previousblockhash: string;
  nextblockhash?: string;
  tx: string[] | Transaction[];
  size: number;
  weight: number;
  nTx: number;
}

export interface BlockHeader {
  hash: string;
  confirmations: number;
  height: number;
  version: number;
  merkleroot: string;
  time: number;
  nonce: number;
  bits: string;
  difficulty: number;
  previousblockhash: string;
  nextblockhash?: string;
}

// ─── Transaction Types ────────────────────────────────────────────────────────

export interface Transaction {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: TxInput[];
  vout: TxOutput[];
  blockhash?: string;
  confirmations?: number;
  blocktime?: number;
  time?: number;
}

export interface TxInput {
  txid?: string;
  vout?: number;
  scriptSig?: { asm: string; hex: string };
  txinwitness?: string[];
  sequence: number;
  coinbase?: string;
}

export interface TxOutput {
  value: number;
  n: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    type: string;
    address?: string;
    addresses?: string[];
  };
}

// ─── Wallet Types ─────────────────────────────────────────────────────────────

export interface WalletInfo {
  walletname: string;
  walletversion: number;
  format: string;
  txcount: number;
  keypoolsize: number;
  keypoolsize_hd_internal: number;
  unlocked_until?: number;
  paytxfee: number;
  hdseedid?: string;
  private_keys_enabled: boolean;
  avoid_reuse: boolean;
  scanning: boolean | { duration: number; progress: number };
  descriptors: boolean;
  external_signer: boolean;
  blank?: boolean;
  birthtime?: number;
}

export interface WalletTransaction {
  address?: string;
  category: 'send' | 'receive' | 'generate' | 'immature' | 'orphan';
  amount: number;
  label?: string;
  vout?: number;
  fee?: number;
  confirmations: number;
  trusted?: boolean;
  blockhash?: string;
  blockheight?: number;
  blockindex?: number;
  blocktime?: number;
  txid: string;
  walletconflicts: string[];
  time: number;
  timereceived: number;
  comment?: string;
  bip125_replaceable: 'yes' | 'no' | 'unknown';
  abandoned?: boolean;
}

export interface ListTransactionsResult {
  transactions: WalletTransaction[];
  lastblock: string;
}

export interface AddressInfo {
  address: string;
  scriptPubKey: string;
  ismine: boolean;
  iswatchonly: boolean;
  solvable: boolean;
  desc?: string;
  isscript: boolean;
  ischange: boolean;
  iswitness: boolean;
  witness_version?: number;
  witness_program?: string;
  pubkey?: string;
  label: string;
  iscompressed?: boolean;
  hdkeypath?: string;
  hdseedid?: string;
  hdmasterfingerprint?: string;
  labels: Array<{ name: string; purpose: 'send' | 'receive' }>;
}

export interface UnspentOutput {
  txid: string;
  vout: number;
  address: string;
  label?: string;
  scriptPubKey: string;
  amount: number;
  confirmations: number;
  spendable: boolean;
  solvable: boolean;
  safe: boolean;
}

// ─── Mining Types ─────────────────────────────────────────────────────────────

export interface MiningInfo {
  blocks: number;
  currentblockweight?: number;
  currentblocktx?: number;
  bits?: string;
  target?: string;
  difficulty: number;
  networkhashps: number;
  pooledtx: number;
  chain: string;
  next?: { height: number; bits: string; difficulty: number; target: string };
  warnings: string | string[];
}

// ─── Network Types ────────────────────────────────────────────────────────────

export interface NetworkInfo {
  version: number;
  subversion: string;
  protocolversion: number;
  localservices: string;
  localservicesnames: string[];
  localrelay: boolean;
  timeoffset: number;
  networkactive: boolean;
  connections: number;
  connections_in: number;
  connections_out: number;
  relayfee: number;
  incrementalfee: number;
  warnings: string | string[];
}

export interface PeerInfo {
  id: number;
  addr: string;
  addrbind?: string;
  addrlocal?: string;
  network: string;
  version: number;
  subver: string;
  inbound: boolean;
  connection_type: string;
  startingheight: number;
  synced_headers: number;
  synced_blocks: number;
}

// ─── Fee Model Types ──────────────────────────────────────────────────────────

export interface FeeModel {
  alpha: number;
  beta: number;
  min: number;
  max: number;
}

export interface FeeEstimate {
  feerate?: number;
  errors?: string[];
  blocks: number;
}

// ─── Send Types ───────────────────────────────────────────────────────────────

export interface SendToAddressOptions {
  comment?: string;
  commentTo?: string;
  subtractFeeFromAmount?: boolean;
  replaceable?: boolean;
  confTarget?: number;
}

export interface CreateWalletResult {
  name: string;
  warning?: string;
}

export interface LoadWalletResult {
  name: string;
  warning?: string;
}
