import type {
  RpcConfig,
  RpcRequest,
  RpcResponse,
  BlockchainInfo,
  Block,
  BlockHeader,
  Transaction,
  WalletInfo,
  WalletTransaction,
  UnspentOutput,
  AddressInfo,
  MiningInfo,
  NetworkInfo,
  PeerInfo,
  FeeModel,
  FeeEstimate,
  SendToAddressOptions,
  CreateWalletResult,
  LoadWalletResult,
} from './types';

export class AdonaiRpcClient {
  private config: RpcConfig;
  private requestId = 0;

  constructor(config: RpcConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    const walletPath = this.config.walletName
      ? `/wallet/${encodeURIComponent(this.config.walletName)}`
      : '';
    return `${this.config.url}${walletPath}`;
  }

  private async call<T>(method: string, params: unknown[] = []): Promise<T> {
    const body: RpcRequest = {
      jsonrpc: '1.1',
      id: ++this.requestId,
      method,
      params,
    };

    const credentials = btoa(
      `${this.config.username}:${this.config.password}`
    );

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: RpcResponse<T> = await response.json();

    if (data.error) {
      throw new Error(`RPC Error ${data.error.code}: ${data.error.message}`);
    }

    return data.result;
  }

  withWallet(walletName: string): AdonaiRpcClient {
    return new AdonaiRpcClient({ ...this.config, walletName });
  }

  // ─── Blockchain ─────────────────────────────────────────────────────────────

  getBlockchainInfo(): Promise<BlockchainInfo> {
    return this.call('getblockchaininfo');
  }

  getBlockCount(): Promise<number> {
    return this.call('getblockcount');
  }

  getBestBlockHash(): Promise<string> {
    return this.call('getbestblockhash');
  }

  getBlockHash(height: number): Promise<string> {
    return this.call('getblockhash', [height]);
  }

  getBlock(hash: string, verbosity: 0): Promise<string>;
  getBlock(hash: string, verbosity: 1): Promise<Block>;
  getBlock(hash: string, verbosity: 2): Promise<Block & { tx: Transaction[] }>;
  getBlock(hash: string, verbosity = 1): Promise<unknown> {
    return this.call('getblock', [hash, verbosity]);
  }

  getBlockHeader(hash: string, verbose = true): Promise<BlockHeader | string> {
    return this.call('getblockheader', [hash, verbose]);
  }

  getDifficulty(): Promise<number> {
    return this.call('getdifficulty');
  }

  // ─── Transactions ────────────────────────────────────────────────────────────

  getRawTransaction(txid: string, verbose: true): Promise<Transaction>;
  getRawTransaction(txid: string, verbose: false): Promise<string>;
  getRawTransaction(txid: string, verbose = true): Promise<unknown> {
    return this.call('getrawtransaction', [txid, verbose]);
  }

  sendRawTransaction(hexString: string, maxFeeRate?: number): Promise<string> {
    const params: unknown[] = [hexString];
    if (maxFeeRate !== undefined) params.push(maxFeeRate);
    return this.call('sendrawtransaction', params);
  }

  // ─── Wallet ──────────────────────────────────────────────────────────────────

  getWalletInfo(): Promise<WalletInfo> {
    return this.call('getwalletinfo');
  }

  getBalance(minConfirmations = 1): Promise<number> {
    return this.call('getbalance', ['*', minConfirmations]);
  }

  getUnconfirmedBalance(): Promise<number> {
    return this.call('getunconfirmedbalance');
  }

  getNewAddress(label = '', addressType = 'bech32'): Promise<string> {
    return this.call('getnewaddress', [label, addressType]);
  }

  getAddressInfo(address: string): Promise<AddressInfo> {
    return this.call('getaddressinfo', [address]);
  }

  listTransactions(
    label = '*',
    count = 20,
    skip = 0,
    includeWatchOnly = false
  ): Promise<WalletTransaction[]> {
    return this.call('listtransactions', [label, count, skip, includeWatchOnly]);
  }

  listUnspent(
    minConf = 1,
    maxConf = 9999999,
    addresses: string[] = []
  ): Promise<UnspentOutput[]> {
    return this.call('listunspent', [minConf, maxConf, addresses]);
  }

  sendToAddress(
    address: string,
    amount: number,
    options: SendToAddressOptions = {}
  ): Promise<string> {
    return this.call('sendtoaddress', [
      address,
      amount,
      options.comment ?? '',
      options.commentTo ?? '',
      options.subtractFeeFromAmount ?? false,
      options.replaceable ?? true,
      options.confTarget ?? 6,
    ]);
  }

  createWallet(
    walletName: string,
    disablePrivateKeys = false,
    blank = false,
    passphrase = '',
    avoidReuse = false,
    descriptors = true
  ): Promise<CreateWalletResult> {
    return this.call('createwallet', [
      walletName,
      disablePrivateKeys,
      blank,
      passphrase,
      avoidReuse,
      descriptors,
    ]);
  }

  loadWallet(walletName: string): Promise<LoadWalletResult> {
    return this.call('loadwallet', [walletName]);
  }

  listWallets(): Promise<string[]> {
    return this.call('listwallets');
  }

  walletPassphrase(passphrase: string, timeout: number): Promise<null> {
    return this.call('walletpassphrase', [passphrase, timeout]);
  }

  walletLock(): Promise<null> {
    return this.call('walletlock');
  }

  encryptWallet(passphrase: string): Promise<string> {
    return this.call('encryptwallet', [passphrase]);
  }

  dumpPrivKey(address: string): Promise<string> {
    return this.call('dumpprivkey', [address]);
  }

  importDescriptors(
    requests: Array<{
      desc: string;
      active?: boolean;
      timestamp: number | 'now';
      internal?: boolean;
      label?: string;
    }>
  ): Promise<Array<{ success: boolean; warnings?: string[]; error?: { code: number; message: string } }>> {
    return this.call('importdescriptors', [requests]);
  }

  // ─── Mining ──────────────────────────────────────────────────────────────────

  getMiningInfo(): Promise<MiningInfo> {
    return this.call('getmininginfo');
  }

  getNetworkHashPs(nBlocks = 120): Promise<number> {
    return this.call('getnetworkhashps', [nBlocks]);
  }

  // ─── Network ─────────────────────────────────────────────────────────────────

  getNetworkInfo(): Promise<NetworkInfo> {
    return this.call('getnetworkinfo');
  }

  getPeerInfo(): Promise<PeerInfo[]> {
    return this.call('getpeerinfo');
  }

  getConnectionCount(): Promise<number> {
    return this.call('getconnectioncount');
  }

  // ─── Fees ────────────────────────────────────────────────────────────────────

  getFeeModel(): Promise<FeeModel> {
    return this.call('getfeemodel');
  }

  estimateSmartFee(confTarget: number): Promise<FeeEstimate> {
    return this.call('estimatesmartfee', [confTarget]);
  }

  // ─── Utility ─────────────────────────────────────────────────────────────────

  validateAddress(address: string): Promise<{ isvalid: boolean; address?: string; scriptPubKey?: string }> {
    return this.call('validateaddress', [address]);
  }

  uptime(): Promise<number> {
    return this.call('uptime');
  }
}
