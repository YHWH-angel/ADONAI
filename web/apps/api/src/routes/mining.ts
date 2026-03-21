import type { FastifyInstance } from 'fastify';
import { AdonaiRpcClient } from '@adonai/rpc-client';
import { spawn, type ChildProcess } from 'child_process';
import { config } from '../config.js';

const ADONAI_CLI = process.env.ADONAI_CLI_PATH ?? '/home/angel/adonai/adonai/build/bin/adonai-cli';
const ADONAI_CONF = process.env.ADONAI_CONF_PATH ?? `${process.env.HOME}/.adonai/adonai.conf`;

interface MinerState {
  process: ChildProcess | null;
  address: string | null;
  startedAt: number | null;
  blocksFound: number;
  lastBlock: string | null;
}

const miner: MinerState = {
  process: null,
  address: null,
  startedAt: null,
  blocksFound: 0,
  lastBlock: null,
};

function spawnMiner(address: string): void {
  if (miner.process) return;

  const args = [
    `-conf=${ADONAI_CONF}`,
    'generatetoaddress',
    '1',
    address,
    '2000000000',
  ];

  function launchOnce() {
    if (!miner.process) return; // stopped externally
    const child = spawn(ADONAI_CLI, args, { detached: false });
    miner.process = child;

    let output = '';
    child.stdout?.on('data', (data: Buffer) => { output += data.toString(); });
    child.on('close', (code: number | null) => {
      if (!miner.process) return; // stopped
      try {
        const hashes: string[] = JSON.parse(output.trim());
        if (hashes.length > 0) {
          miner.blocksFound += hashes.length;
          miner.lastBlock = hashes[hashes.length - 1];
        }
      } catch { /* ignore parse errors */ }
      output = '';
      // Restart for next block
      miner.process = child; // placeholder so launchOnce runs
      setTimeout(launchOnce, 100);
    });
  }

  // Set process to a sentinel so launchOnce knows to start
  miner.process = {} as ChildProcess;
  launchOnce();
}

export async function miningRoutes(
  fastify: FastifyInstance,
  rpc: AdonaiRpcClient
) {
  // GET /mining/status
  fastify.get('/mining/status', async () => {
    return {
      active: miner.process !== null,
      address: miner.address,
      startedAt: miner.startedAt,
      blocksFound: miner.blocksFound,
      lastBlock: miner.lastBlock,
    };
  });

  // POST /mining/start  { walletName, address? }
  fastify.post('/mining/start', async (request, reply) => {
    if (miner.process) {
      return reply.code(409).send({ error: 'Miner already running' });
    }

    const { walletName, address } = request.body as {
      walletName?: string;
      address?: string;
    };

    let miningAddress = address;
    if (!miningAddress) {
      // Resolve actual loaded wallet (handles "HD Wallet" → "wallet1" fallback)
      const loaded = await rpc.listWallets();
      const resolvedWallet = walletName && loaded.includes(walletName)
        ? walletName
        : loaded[0];
      if (!resolvedWallet) {
        return reply.code(400).send({ error: 'No wallet loaded on node' });
      }
      const rpcWithWallet = rpc.withWallet(resolvedWallet);
      miningAddress = await rpcWithWallet.getNewAddress('mining');
    }

    miner.address = miningAddress;
    miner.startedAt = Date.now();
    miner.blocksFound = 0;
    miner.lastBlock = null;

    spawnMiner(miningAddress);

    return { started: true, address: miningAddress };
  });

  // POST /mining/stop
  fastify.post('/mining/stop', async () => {
    if (!miner.process) {
      return { stopped: false, reason: 'Not running' };
    }
    try {
      if (typeof (miner.process as ChildProcess).pid === 'number') {
        (miner.process as ChildProcess).kill('SIGTERM');
      }
    } catch { /* ignore */ }
    miner.process = null;
    miner.address = null;
    miner.startedAt = null;

    return { stopped: true, blocksFound: miner.blocksFound };
  });

  // POST /mining/mine-blocks  { walletName, blocks }  – quick synchronous mine
  fastify.post('/mining/mine-blocks', async (request, reply) => {
    const { walletName, blocks = 1 } = request.body as {
      walletName?: string;
      blocks?: number;
    };

    const loaded = await rpc.listWallets();
    const resolvedWallet = walletName && loaded.includes(walletName)
      ? walletName
      : loaded[0];
    if (!resolvedWallet) {
      return reply.code(400).send({ error: 'No wallet loaded on node' });
    }

    const rpcWithWallet = rpc.withWallet(resolvedWallet);
    const address = await rpcWithWallet.getNewAddress('mining');
    const hashes = await rpcWithWallet.generateToAddress(blocks, address, 2_000_000_000);
    return { hashes, address, blocksRequested: blocks };
  });
}
