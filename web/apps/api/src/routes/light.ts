import type { FastifyInstance } from 'fastify';
import { AdonaiRpcClient } from '@adonai/rpc-client';

/**
 * Light wallet routes — no server-side wallet needed.
 * Uses scantxoutset to find UTXOs for any xpub without storing keys.
 */
export async function lightRoutes(app: FastifyInstance, rpc: AdonaiRpcClient) {

  // POST /light/scan
  // Body: { xpub: string, receiveRange?: number, changeRange?: number }
  // Returns: balance (ADO) + UTXOs list
  app.post<{
    Body: { xpub: string; receiveRange?: number; changeRange?: number };
  }>('/light/scan', async (req, reply) => {
    const { xpub, receiveRange = 200, changeRange = 50 } = req.body;

    if (!xpub || typeof xpub !== 'string' || xpub.length < 20) {
      return reply.status(400).send({ error: 'Invalid xpub' });
    }

    try {
      const result = await rpc.scantxoutset('start', [
        { desc: `wpkh(${xpub}/0/*)`, range: [0, receiveRange] },
        { desc: `wpkh(${xpub}/1/*)`, range: [0, changeRange] },
      ]);

      return {
        balance: result.total_amount,
        utxos: result.unspents,
        height: result.height,
        bestblock: result.bestblock,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ error: msg });
    }
  });

  // POST /light/broadcast
  // Body: { hex: string }
  app.post<{ Body: { hex: string } }>('/light/broadcast', async (req, reply) => {
    const { hex } = req.body;
    if (!hex) return reply.status(400).send({ error: 'Missing hex' });

    try {
      const txid = await rpc.sendRawTransaction(hex);
      return { txid };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(400).send({ error: msg });
    }
  });

  // POST /light/import
  // Body: { xpub: string }
  // Creates (or loads) a watch-only descriptor wallet for the xpub and imports descriptors
  app.post<{
    Body: { xpub: string };
    Reply: { walletId: string; created: boolean; scanning: boolean } | { error: string };
  }>('/light/import', async (req, reply) => {
    const { xpub } = req.body;

    if (!xpub || typeof xpub !== 'string' || xpub.length < 20) {
      return reply.status(400).send({ error: 'Invalid xpub' });
    }

    const walletId = `light_${xpub.slice(4, 12)}`;
    let created = false;

    try {
      // Try to create the wallet
      await rpc.createWallet(walletId, true, true, '', false, true);
      created = true;
    } catch {
      // Wallet likely already exists — try to load it
      try {
        await rpc.loadWallet(walletId);
      } catch {
        // Wallet might already be loaded — that's fine, continue
      }
    }

    // Import descriptors on the wallet-scoped RPC client
    // timestamp: 0 triggers a full rescan from genesis (async on node side)
    const walletRpc = rpc.withWallet(walletId);
    try {
      await walletRpc.importDescriptors([
        { desc: `wpkh(${xpub}/0/*)`, timestamp: 0, range: [0, 200], active: true, internal: false },
        { desc: `wpkh(${xpub}/1/*)`, timestamp: 0, range: [0, 50], active: true, internal: true },
      ]);
    } catch {
      // importDescriptors may fail if already imported — not fatal
    }

    return { walletId, created, scanning: true };
  });

  // GET /light/:walletId/transactions
  // Returns transaction history for a watch-only descriptor wallet
  app.get<{
    Params: { walletId: string };
    Querystring: { count?: string; skip?: string };
    Reply: { transactions: import('@adonai/rpc-client').WalletTransaction[] } | { error: string };
  }>('/light/:walletId/transactions', async (req, reply) => {
    const { walletId } = req.params;
    const count = parseInt(req.query.count ?? '50', 10);
    const skip = parseInt(req.query.skip ?? '0', 10);

    if (!walletId) {
      return reply.status(400).send({ error: 'Missing walletId' });
    }

    // Try to load wallet in case it isn't loaded
    try {
      await rpc.loadWallet(walletId);
    } catch {
      // Already loaded or doesn't exist — continue
    }

    try {
      const walletRpc = rpc.withWallet(walletId);
      const transactions = await walletRpc.listTransactions('*', count, skip, true);
      // Reverse so newest is first
      return { transactions: transactions.reverse() };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ error: msg });
    }
  });
}
