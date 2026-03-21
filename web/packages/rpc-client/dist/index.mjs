// src/client.ts
var AdonaiRpcClient = class _AdonaiRpcClient {
  constructor(config) {
    this.requestId = 0;
    this.config = config;
  }
  get baseUrl() {
    const walletPath = this.config.walletName ? `/wallet/${encodeURIComponent(this.config.walletName)}` : "";
    return `${this.config.url}${walletPath}`;
  }
  async call(method, params = []) {
    const body = {
      jsonrpc: "1.0",
      id: ++this.requestId,
      method,
      params
    };
    const credentials = btoa(
      `${this.config.username}:${this.config.password}`
    );
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(`RPC Error ${data.error.code}: ${data.error.message}`);
    }
    return data.result;
  }
  withWallet(walletName) {
    return new _AdonaiRpcClient({ ...this.config, walletName });
  }
  // ─── Blockchain ─────────────────────────────────────────────────────────────
  getBlockchainInfo() {
    return this.call("getblockchaininfo");
  }
  getBlockCount() {
    return this.call("getblockcount");
  }
  getBestBlockHash() {
    return this.call("getbestblockhash");
  }
  getBlockHash(height) {
    return this.call("getblockhash", [height]);
  }
  getBlock(hash, verbosity = 1) {
    return this.call("getblock", [hash, verbosity]);
  }
  getBlockHeader(hash, verbose = true) {
    return this.call("getblockheader", [hash, verbose]);
  }
  getDifficulty() {
    return this.call("getdifficulty");
  }
  getRawTransaction(txid, verbose = true) {
    return this.call("getrawtransaction", [txid, verbose]);
  }
  sendRawTransaction(hexString, maxFeeRate) {
    const params = [hexString];
    if (maxFeeRate !== void 0) params.push(maxFeeRate);
    return this.call("sendrawtransaction", params);
  }
  // ─── Wallet ──────────────────────────────────────────────────────────────────
  getWalletInfo() {
    return this.call("getwalletinfo");
  }
  getBalance(minConfirmations = 1) {
    return this.call("getbalance", ["*", minConfirmations]);
  }
  getBalances() {
    return this.call("getbalances");
  }
  getUnconfirmedBalance() {
    return this.getBalances().then(
      (b) => b.mine.untrusted_pending + b.mine.immature
    );
  }
  getNewAddress(label = "", addressType = "bech32") {
    return this.call("getnewaddress", [label, addressType]);
  }
  getAddressInfo(address) {
    return this.call("getaddressinfo", [address]);
  }
  listTransactions(label = "*", count = 20, skip = 0, includeWatchOnly = false) {
    return this.call("listtransactions", [label, count, skip, includeWatchOnly]);
  }
  listUnspent(minConf = 1, maxConf = 9999999, addresses = []) {
    return this.call("listunspent", [minConf, maxConf, addresses]);
  }
  sendToAddress(address, amount, options = {}) {
    if (options.feeRate !== void 0) {
      return this.call("sendtoaddress", [
        address,
        amount,
        options.comment ?? "",
        options.commentTo ?? "",
        options.subtractFeeFromAmount ?? false,
        options.replaceable ?? true,
        null,
        // conf_target (null = no estimation)
        "unset",
        // estimate_mode
        false,
        // avoid_reuse
        options.feeRate
      ]);
    }
    return this.call("sendtoaddress", [
      address,
      amount,
      options.comment ?? "",
      options.commentTo ?? "",
      options.subtractFeeFromAmount ?? false,
      options.replaceable ?? true,
      options.confTarget ?? 6
    ]);
  }
  createWallet(walletName, disablePrivateKeys = false, blank = false, passphrase = "", avoidReuse = false, descriptors = true) {
    return this.call("createwallet", [
      walletName,
      disablePrivateKeys,
      blank,
      passphrase,
      avoidReuse,
      descriptors
    ]);
  }
  loadWallet(walletName) {
    return this.call("loadwallet", [walletName]);
  }
  listWallets() {
    return this.call("listwallets");
  }
  walletPassphrase(passphrase, timeout) {
    return this.call("walletpassphrase", [passphrase, timeout]);
  }
  walletLock() {
    return this.call("walletlock");
  }
  encryptWallet(passphrase) {
    return this.call("encryptwallet", [passphrase]);
  }
  dumpPrivKey(address) {
    return this.call("dumpprivkey", [address]);
  }
  importDescriptors(requests) {
    return this.call("importdescriptors", [requests]);
  }
  // ─── Mining ──────────────────────────────────────────────────────────────────
  getMiningInfo() {
    return this.call("getmininginfo");
  }
  getNetworkHashPs(nBlocks = 120) {
    return this.call("getnetworkhashps", [nBlocks]);
  }
  generateToAddress(nBlocks, address, maxTries = 1e6) {
    return this.call("generatetoaddress", [nBlocks, address, maxTries]);
  }
  // ─── Network ─────────────────────────────────────────────────────────────────
  getNetworkInfo() {
    return this.call("getnetworkinfo");
  }
  getPeerInfo() {
    return this.call("getpeerinfo");
  }
  getConnectionCount() {
    return this.call("getconnectioncount");
  }
  // ─── Fees ────────────────────────────────────────────────────────────────────
  getFeeModel() {
    return this.call("getfeemodel");
  }
  estimateSmartFee(confTarget) {
    return this.call("estimatesmartfee", [confTarget]);
  }
  // ─── Light Wallet ────────────────────────────────────────────────────────────
  scantxoutset(action, scanobjects) {
    return this.call("scantxoutset", [action, scanobjects]);
  }
  // ─── Utility ─────────────────────────────────────────────────────────────────
  validateAddress(address) {
    return this.call("validateaddress", [address]);
  }
  uptime() {
    return this.call("uptime");
  }
};
export {
  AdonaiRpcClient
};
