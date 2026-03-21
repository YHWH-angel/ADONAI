interface RpcConfig {
    url: string;
    username: string;
    password: string;
    walletName?: string;
}
interface BlockchainInfo {
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
interface Block {
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
interface BlockHeader {
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
interface Transaction {
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
interface TxInput {
    txid?: string;
    vout?: number;
    scriptSig?: {
        asm: string;
        hex: string;
    };
    txinwitness?: string[];
    sequence: number;
    coinbase?: string;
}
interface TxOutput {
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
interface WalletInfo {
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
    scanning: boolean | {
        duration: number;
        progress: number;
    };
    descriptors: boolean;
    external_signer: boolean;
    blank?: boolean;
    birthtime?: number;
}
interface WalletTransaction {
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
interface AddressInfo {
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
    labels: Array<{
        name: string;
        purpose: 'send' | 'receive';
    }>;
}
interface UnspentOutput {
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
interface MiningInfo {
    blocks: number;
    currentblockweight?: number;
    currentblocktx?: number;
    bits?: string;
    target?: string;
    difficulty: number;
    networkhashps: number;
    pooledtx: number;
    chain: string;
    next?: {
        height: number;
        bits: string;
        difficulty: number;
        target: string;
    };
    warnings: string | string[];
}
interface NetworkInfo {
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
interface PeerInfo {
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
interface FeeModel {
    alpha: number;
    beta: number;
    min: number;
    max: number;
}
interface FeeEstimate {
    feerate?: number;
    errors?: string[];
    blocks: number;
}
interface SendToAddressOptions {
    comment?: string;
    commentTo?: string;
    subtractFeeFromAmount?: boolean;
    replaceable?: boolean;
    confTarget?: number;
    feeRate?: number;
}
interface CreateWalletResult {
    name: string;
    warning?: string;
}
interface LoadWalletResult {
    name: string;
    warning?: string;
}
interface ScannedUTXO {
    txid: string;
    vout: number;
    scriptPubKey: string;
    desc: string;
    amount: number;
    coinbase: boolean;
    height: number;
}
interface ScantxoutsetResult {
    success: boolean;
    txouts: number;
    height: number;
    bestblock: string;
    unspents: ScannedUTXO[];
    total_amount: number;
}

declare class AdonaiRpcClient {
    private config;
    private requestId;
    constructor(config: RpcConfig);
    private get baseUrl();
    private call;
    withWallet(walletName: string): AdonaiRpcClient;
    getBlockchainInfo(): Promise<BlockchainInfo>;
    getBlockCount(): Promise<number>;
    getBestBlockHash(): Promise<string>;
    getBlockHash(height: number): Promise<string>;
    getBlock(hash: string, verbosity: 0): Promise<string>;
    getBlock(hash: string, verbosity: 1): Promise<Block>;
    getBlock(hash: string, verbosity: 2): Promise<Block & {
        tx: Transaction[];
    }>;
    getBlockHeader(hash: string, verbose?: boolean): Promise<BlockHeader | string>;
    getDifficulty(): Promise<number>;
    getRawTransaction(txid: string, verbose: true): Promise<Transaction>;
    getRawTransaction(txid: string, verbose: false): Promise<string>;
    sendRawTransaction(hexString: string, maxFeeRate?: number): Promise<string>;
    getWalletInfo(): Promise<WalletInfo>;
    getBalance(minConfirmations?: number): Promise<number>;
    getBalances(): Promise<{
        mine: {
            trusted: number;
            untrusted_pending: number;
            immature: number;
        };
    }>;
    getUnconfirmedBalance(): Promise<number>;
    getNewAddress(label?: string, addressType?: string): Promise<string>;
    getAddressInfo(address: string): Promise<AddressInfo>;
    listTransactions(label?: string, count?: number, skip?: number, includeWatchOnly?: boolean): Promise<WalletTransaction[]>;
    listUnspent(minConf?: number, maxConf?: number, addresses?: string[]): Promise<UnspentOutput[]>;
    sendToAddress(address: string, amount: number, options?: SendToAddressOptions): Promise<string>;
    createWallet(walletName: string, disablePrivateKeys?: boolean, blank?: boolean, passphrase?: string, avoidReuse?: boolean, descriptors?: boolean): Promise<CreateWalletResult>;
    loadWallet(walletName: string): Promise<LoadWalletResult>;
    listWallets(): Promise<string[]>;
    walletPassphrase(passphrase: string, timeout: number): Promise<null>;
    walletLock(): Promise<null>;
    encryptWallet(passphrase: string): Promise<string>;
    dumpPrivKey(address: string): Promise<string>;
    importDescriptors(requests: Array<{
        desc: string;
        active?: boolean;
        timestamp: number | 'now';
        internal?: boolean;
        label?: string;
    }>): Promise<Array<{
        success: boolean;
        warnings?: string[];
        error?: {
            code: number;
            message: string;
        };
    }>>;
    getMiningInfo(): Promise<MiningInfo>;
    getNetworkHashPs(nBlocks?: number): Promise<number>;
    generateToAddress(nBlocks: number, address: string, maxTries?: number): Promise<string[]>;
    getNetworkInfo(): Promise<NetworkInfo>;
    getPeerInfo(): Promise<PeerInfo[]>;
    getConnectionCount(): Promise<number>;
    getFeeModel(): Promise<FeeModel>;
    estimateSmartFee(confTarget: number): Promise<FeeEstimate>;
    scantxoutset(action: 'start' | 'abort' | 'status', scanobjects: Array<{
        desc: string;
        range?: number | [number, number];
    }>): Promise<ScantxoutsetResult>;
    validateAddress(address: string): Promise<{
        isvalid: boolean;
        address?: string;
        scriptPubKey?: string;
    }>;
    uptime(): Promise<number>;
}

export { type AddressInfo, AdonaiRpcClient, type Block, type BlockHeader, type BlockchainInfo, type CreateWalletResult, type FeeEstimate, type FeeModel, type LoadWalletResult, type MiningInfo, type NetworkInfo, type PeerInfo, type RpcConfig, type ScannedUTXO, type ScantxoutsetResult, type SendToAddressOptions, type Transaction, type TxInput, type TxOutput, type UnspentOutput, type WalletInfo, type WalletTransaction };
