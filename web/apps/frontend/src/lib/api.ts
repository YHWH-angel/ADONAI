// API client for the Fastify bridge

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001/ws';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? 'API error');
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Blockchain
  getStats: () => apiFetch<{
    blockchain: import('@adonai/rpc-client').BlockchainInfo;
    mining: import('@adonai/rpc-client').MiningInfo;
    network: import('@adonai/rpc-client').NetworkInfo;
  }>('/blockchain/stats'),

  getBlock: (hash: string) =>
    apiFetch<import('@adonai/rpc-client').Block>(`/blockchain/block/${hash}`),

  getBlockByHeight: (height: number) =>
    apiFetch<import('@adonai/rpc-client').Block>(`/blockchain/block-by-height/${height}`),

  getTx: (txid: string) =>
    apiFetch<import('@adonai/rpc-client').Transaction>(`/blockchain/tx/${txid}`),

  // Wallet
  listWallets: () =>
    apiFetch<{ wallets: string[] }>('/wallet/list'),

  getWalletInfo: (walletName: string) =>
    apiFetch<{
      info: import('@adonai/rpc-client').WalletInfo;
      balance: number;
      unconfirmed: number;
      resolvedWallet?: string;
    }>(`/wallet/${encodeURIComponent(walletName)}/info`),

  newAddress: (walletName: string, label?: string) =>
    apiFetch<{ address: string }>(`/wallet/${encodeURIComponent(walletName)}/address`, {
      method: 'POST',
      body: JSON.stringify({ label }),
    }),

  getTransactions: (walletName: string, count = 20, skip = 0) =>
    apiFetch<{ transactions: import('@adonai/rpc-client').WalletTransaction[] }>(
      `/wallet/${encodeURIComponent(walletName)}/transactions?count=${count}&skip=${skip}`
    ),

  getUtxos: (walletName: string) =>
    apiFetch<{ utxos: import('@adonai/rpc-client').UnspentOutput[] }>(
      `/wallet/${encodeURIComponent(walletName)}/utxos`
    ),

  send: (walletName: string, address: string, amount: number, subtractFee = false) =>
    apiFetch<{ txid: string }>(`/wallet/${encodeURIComponent(walletName)}/send`, {
      method: 'POST',
      body: JSON.stringify({ address, amount, subtractFee }),
    }),

  broadcast: (hex: string) =>
    apiFetch<{ txid: string }>('/wallet/broadcast', {
      method: 'POST',
      body: JSON.stringify({ hex }),
    }),

  validateAddress: (address: string) =>
    apiFetch<{ isvalid: boolean }>(`/wallet/validate/${address}`),

  getMiningRewards: (walletName: string, count = 100) =>
    apiFetch<{
      rewards: import('@adonai/rpc-client').WalletTransaction[];
      totalRewards: number;
    }>(`/wallet/${encodeURIComponent(walletName)}/mining-rewards?count=${count}`),

  getFeeEstimate: (blocks = 6) =>
    apiFetch<{
      estimate: import('@adonai/rpc-client').FeeEstimate;
      model: import('@adonai/rpc-client').FeeModel;
    }>(`/wallet/fee-estimate?blocks=${blocks}`),

  // Mining control
  getMiningStatus: () =>
    apiFetch<{
      active: boolean;
      address: string | null;
      startedAt: number | null;
      blocksFound: number;
      lastBlock: string | null;
    }>('/mining/status'),

  startMining: (walletName: string, address?: string) =>
    apiFetch<{ started: boolean; address: string }>('/mining/start', {
      method: 'POST',
      body: JSON.stringify({ walletName, address }),
    }),

  stopMining: () =>
    apiFetch<{ stopped: boolean; blocksFound: number }>('/mining/stop', {
      method: 'POST',
      body: '{}',
    }),

  mineBlocks: (walletName: string, blocks = 1) =>
    apiFetch<{ hashes: string[]; address: string; blocksRequested: number }>('/mining/mine-blocks', {
      method: 'POST',
      body: JSON.stringify({ walletName, blocks }),
    }),

  // Network
  getNetworkInfo: () =>
    apiFetch<import('@adonai/rpc-client').NetworkInfo>('/network/info'),

  getPeers: () =>
    apiFetch<{ peers: import('@adonai/rpc-client').PeerInfo[]; count: number }>('/network/peers'),

  // Light wallet
  lightScan: (xpub: string) =>
    apiFetch<{
      balance: number;
      utxos: import('@adonai/rpc-client').ScannedUTXO[];
      height: number;
      bestblock: string;
    }>('/light/scan', {
      method: 'POST',
      body: JSON.stringify({ xpub }),
    }),

  lightBroadcast: (hex: string) =>
    apiFetch<{ txid: string }>('/light/broadcast', {
      method: 'POST',
      body: JSON.stringify({ hex }),
    }),

  lightImport: (xpub: string) =>
    apiFetch<{ walletId: string; created: boolean; scanning: boolean }>('/light/import', {
      method: 'POST',
      body: JSON.stringify({ xpub }),
    }),

  lightTransactions: (walletId: string, count = 50, skip = 0) =>
    apiFetch<{ transactions: import('@adonai/rpc-client').WalletTransaction[] }>(
      `/light/${walletId}/transactions?count=${count}&skip=${skip}`
    ),
};
