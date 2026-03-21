import type { FastifyInstance } from 'fastify';
import { AdonaiRpcClient } from '@adonai/rpc-client';

export async function networkRoutes(
  fastify: FastifyInstance,
  rpc: AdonaiRpcClient
) {
  fastify.get('/network/info', async () => {
    return rpc.getNetworkInfo();
  });

  fastify.get('/network/peers', async () => {
    const peers = await rpc.getPeerInfo();
    return { peers, count: peers.length };
  });

  fastify.get('/network/connections', async () => {
    const count = await rpc.getConnectionCount();
    return { connections: count };
  });
}
