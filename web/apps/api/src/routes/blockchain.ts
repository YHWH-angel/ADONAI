import type { FastifyInstance } from 'fastify';
import { AdonaiRpcClient } from '@adonai/rpc-client';

export async function blockchainRoutes(
  fastify: FastifyInstance,
  rpc: AdonaiRpcClient
) {
  fastify.get('/blockchain/info', async () => {
    return rpc.getBlockchainInfo();
  });

  fastify.get('/blockchain/block/:hash', async (request) => {
    const { hash } = request.params as { hash: string };
    return rpc.getBlock(hash, 2);
  });

  fastify.get('/blockchain/block-by-height/:height', async (request) => {
    const { height } = request.params as { height: string };
    const hash = await rpc.getBlockHash(parseInt(height));
    return rpc.getBlock(hash, 2);
  });

  fastify.get('/blockchain/tx/:txid', async (request) => {
    const { txid } = request.params as { txid: string };
    return rpc.getRawTransaction(txid, true);
  });

  fastify.get('/blockchain/difficulty', async () => {
    const difficulty = await rpc.getDifficulty();
    return { difficulty };
  });

  fastify.get('/blockchain/stats', async () => {
    const [info, miningInfo, networkInfo] = await Promise.all([
      rpc.getBlockchainInfo(),
      rpc.getMiningInfo(),
      rpc.getNetworkInfo(),
    ]);
    return { blockchain: info, mining: miningInfo, network: networkInfo };
  });
}
