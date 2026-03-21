import type { FastifyInstance } from 'fastify';
import { AdonaiRpcClient } from '@adonai/rpc-client';

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
  fastify.get('/wallet/:walletName/info', async (request) => {
    const { walletName } = request.params as { walletName: string };
    const walletRpc = rpc.withWallet(walletName);
    const [info, balance, unconfirmed] = await Promise.all([
      walletRpc.getWalletInfo(),
      walletRpc.getBalance(),
      walletRpc.getUnconfirmedBalance(),
    ]);
    return { info, balance, unconfirmed };
  });

  // Generate a new receive address
  fastify.post('/wallet/:walletName/address', async (request) => {
    const { walletName } = request.params as { walletName: string };
    const { label = '' } = request.body as { label?: string };
    const walletRpc = rpc.withWallet(walletName);
    const address = await walletRpc.getNewAddress(label);
    return { address };
  });

  // List transactions
  fastify.get('/wallet/:walletName/transactions', async (request) => {
    const { walletName } = request.params as { walletName: string };
    const { count = '20', skip = '0' } = request.query as {
      count?: string;
      skip?: string;
    };
    const walletRpc = rpc.withWallet(walletName);
    const transactions = await walletRpc.listTransactions(
      '*',
      parseInt(count),
      parseInt(skip)
    );
    return { transactions };
  });

  // List UTXOs
  fastify.get('/wallet/:walletName/utxos', async (request) => {
    const { walletName } = request.params as { walletName: string };
    const walletRpc = rpc.withWallet(walletName);
    const utxos = await walletRpc.listUnspent();
    return { utxos };
  });

  // Send to address
  fastify.post('/wallet/:walletName/send', async (request) => {
    const { walletName } = request.params as { walletName: string };
    const { address, amount, subtractFee = false } = request.body as {
      address: string;
      amount: number;
      subtractFee?: boolean;
    };
    const walletRpc = rpc.withWallet(walletName);
    const txid = await walletRpc.sendToAddress(address, amount, {
      subtractFeeFromAmount: subtractFee,
    });
    return { txid };
  });

  // Broadcast a raw signed transaction (for client-side signing)
  fastify.post('/wallet/broadcast', async (request) => {
    const { hex } = request.body as { hex: string };
    const txid = await rpc.sendRawTransaction(hex);
    return { txid };
  });

  // Validate address
  fastify.get('/wallet/validate/:address', async (request) => {
    const { address } = request.params as { address: string };
    return rpc.validateAddress(address);
  });

  // Get mining rewards for an address (filter generate category)
  fastify.get('/wallet/:walletName/mining-rewards', async (request) => {
    const { walletName } = request.params as { walletName: string };
    const { count = '100' } = request.query as { count?: string };
    const walletRpc = rpc.withWallet(walletName);
    const transactions = await walletRpc.listTransactions('*', parseInt(count), 0);
    const rewards = transactions.filter(
      (tx) => tx.category === 'generate' || tx.category === 'immature'
    );
    const totalRewards = rewards.reduce((sum, tx) => sum + tx.amount, 0);
    return { rewards, totalRewards };
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
