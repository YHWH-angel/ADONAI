import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { AdonaiRpcClient } from '@adonai/rpc-client';

import { config } from './config.js';
import { blockchainRoutes } from './routes/blockchain.js';
import { walletRoutes } from './routes/wallet.js';
import { networkRoutes } from './routes/network.js';
import { setupWebSocket } from './websocket.js';

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
});

const rpc = new AdonaiRpcClient(config.rpc);

await fastify.register(cors, {
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'OPTIONS'],
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

await fastify.register(websocket);

// Health check
fastify.get('/health', async () => {
  try {
    const uptime = await rpc.uptime();
    return { status: 'ok', nodeUptime: uptime };
  } catch {
    return { status: 'node_unreachable' };
  }
});

// API routes under /api/v1
await fastify.register(
  async (app) => {
    await blockchainRoutes(app, rpc);
    await walletRoutes(app, rpc);
    await networkRoutes(app, rpc);
  },
  { prefix: '/api/v1' }
);

// WebSocket at root level
setupWebSocket(fastify, rpc, config.blockPollInterval);

try {
  await fastify.listen({ port: config.port, host: config.host });
  console.log(`ADONAI API Bridge running on http://${config.host}:${config.port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
