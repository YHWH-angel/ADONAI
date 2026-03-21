import type { FastifyInstance } from 'fastify';
import { AdonaiRpcClient } from '@adonai/rpc-client';

// Resolve the actual node wallet to use for a given requested wallet name.
// If walletName exists as a loaded wallet → use it.
// Otherwise fall back to the first loaded wallet (usually "wallet1" / "wallet2").
async function resolveWallet(rpc: AdonaiRpcClient, walletName: string): Promise<string> {
  const loaded = await rpc.listWallets();
  if (loaded.includes(walletName)) return walletName;
  if (loaded.length > 0) return loaded[0];
  return walletName; // fallback, will error on actual call
}

export async function walletRoutes(
  fastify: FastifyInstance,
  rpc: AdonaiRpcClient
) {
  // List available wallets on the node
  fastify.get('/wallet/list', async () => {
    const wallets = await rpc.listWallets();
    return { wallets };
  });

  // Get wallet balance and info
  fastify.get('/wallet/:walletName/info', async (request, reply) => {
    const { walletName } = request.params as { walletName: string };
    try {
      const resolved = await resolveWallet(rpc, walletName);
      const walletRpc = rpc.withWallet(resolved);
      const [info, balance, unconfirmed] = await Promise.all([
        walletRpc.getWalletInfo(),
        walletRpc.getBalance(0),   // 0 = include unconfirmed change
        walletRpc.getUnconfirmedBalance(),
      ]);
      return { info, balance, unconfirmed, resolvedWallet: resolved };
    } catch (err: unknown) {
      reply.code(503);
      return { error: 'Wallet not available', detail: String(err) };
    }
  });

  // Generate a new receive address
  fastify.post('/wallet/:walletName/address', async (request, reply) => {
    const { walletName } = request.params as { walletName: string };
    const { label = '' } = request.body as { label?: string };
    try {
      const resolved = await resolveWallet(rpc, walletName);
      const walletRpc = rpc.withWallet(resolved);
      const address = await walletRpc.getNewAddress(label);
      return { address };
    } catch (err: unknown) {
      reply.code(503);
      return { error: 'Cannot generate address', detail: String(err) };
    }
  });

  // List transactions
  fastify.get('/wallet/:walletName/transactions', async (request, reply) => {
    const { walletName } = request.params as { walletName: string };
    const { count = '20', skip = '0' } = request.query as {
      count?: string;
      skip?: string;
    };
    try {
      const resolved = await resolveWallet(rpc, walletName);
      const walletRpc = rpc.withWallet(resolved);
      const transactions = await walletRpc.listTransactions(
        '*',
        parseInt(count),
        parseInt(skip)
      );
      return { transactions };
    } catch {
      return { transactions: [] };
    }
  });

  // List UTXOs
  fastify.get('/wallet/:walletName/utxos', async (request, reply) => {
    const { walletName } = request.params as { walletName: string };
    try {
      const resolved = await resolveWallet(rpc, walletName);
      const walletRpc = rpc.withWallet(resolved);
      const utxos = await walletRpc.listUnspent();
      return { utxos };
    } catch {
      return { utxos: [] };
    }
  });

  // Send to address
  fastify.post('/wallet/:walletName/send', async (request, reply) => {
    const { walletName } = request.params as { walletName: string };
    const { address, amount, subtractFee = false } = request.body as {
      address: string;
      amount: number;
      subtractFee?: boolean;
    };
    try {
      const resolved = await resolveWallet(rpc, walletName);
      const walletRpc = rpc.withWallet(resolved);
      const txid = await walletRpc.sendToAddress(address, amount, {
        subtractFeeFromAmount: subtractFee,
      });
      return { txid };
    } catch (err: unknown) {
      reply.code(400);
      return { error: String(err) };
    }
  });

  // Broadcast a raw signed transaction (for client-side signing)
  fastify.post('/wallet/broadcast', async (request, reply) => {
    const { hex } = request.body as { hex: string };
    try {
      const txid = await rpc.sendRawTransaction(hex);
      return { txid };
    } catch (err: unknown) {
      reply.code(400);
      return { error: String(err) };
    }
  });

  // Validate address
  fastify.get('/wallet/validate/:address', async (request) => {
    const { address } = request.params as { address: string };
    return rpc.validateAddress(address);
  });

  // Get mining rewards for a wallet
  fastify.get('/wallet/:walletName/mining-rewards', async (request) => {
    const { walletName } = request.params as { walletName: string };
    const { count = '100' } = request.query as { count?: string };
    try {
      const resolved = await resolveWallet(rpc, walletName);
      const walletRpc = rpc.withWallet(resolved);
      const transactions = await walletRpc.listTransactions('*', parseInt(count), 0);
      const rewards = transactions
        .filter((tx) => tx.category === 'generate' || tx.category === 'immature')
        .reverse(); // newest first
      const totalRewards = rewards.reduce((sum, tx) => sum + tx.amount, 0);
      return { rewards, totalRewards };
    } catch {
      return { rewards: [], totalRewards: 0 };
    }
  });

  // Fee estimate
  fastify.get('/wallet/fee-estimate', async (request) => {
    const { blocks = '6' } = request.query as { blocks?: string };
    const [estimate, model] = await Promise.all([
      rpc.estimateSmartFee(parseInt(blocks)),
      rpc.getFeeModel(),
    ]);
    return { estimate, model };
  });
}
