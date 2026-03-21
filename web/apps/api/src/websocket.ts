import type { FastifyInstance } from 'fastify';
import { AdonaiRpcClient } from '@adonai/rpc-client';

interface WsClient {
  socket: { send: (data: string) => void; readyState: number };
  walletName?: string;
}

const OPEN = 1;

export function setupWebSocket(fastify: FastifyInstance, rpc: AdonaiRpcClient, pollInterval: number) {
  const clients = new Set<WsClient>();
  let lastBlockHash = '';
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  async function broadcastNewBlock() {
    try {
      const hash = await rpc.getBestBlockHash();
      if (hash === lastBlockHash) return;
      lastBlockHash = hash;

      const [block, info] = await Promise.all([
        rpc.getBlock(hash, 1),
        rpc.getBlockchainInfo(),
      ]);

      const message = JSON.stringify({
        type: 'new_block',
        data: {
          hash,
          height: block.height,
          time: block.time,
          txCount: block.nTx,
          difficulty: block.difficulty,
          chainHeight: info.blocks,
        },
      });

      for (const client of clients) {
        if (client.socket.readyState === OPEN) {
          client.socket.send(message);
        }
      }
    } catch {
      // Node may be temporarily unavailable
    }
  }

  fastify.get('/ws', { websocket: true }, (socket) => {
    const client: WsClient = { socket };
    clients.add(client);

    // Start polling when first client connects
    if (clients.size === 1) {
      pollTimer = setInterval(broadcastNewBlock, pollInterval);
    }

    // Send current status on connect
    rpc.getBlockchainInfo().then((info) => {
      socket.send(JSON.stringify({ type: 'connected', data: info }));
    }).catch(() => {});

    socket.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as { type: string; walletName?: string };
        if (msg.type === 'subscribe_wallet' && msg.walletName) {
          client.walletName = msg.walletName;
        }
      } catch {
        // ignore malformed messages
      }
    });

    socket.on('close', () => {
      clients.delete(client);
      if (clients.size === 0 && pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    });
  });
}
