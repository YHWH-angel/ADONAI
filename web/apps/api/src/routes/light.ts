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
}
