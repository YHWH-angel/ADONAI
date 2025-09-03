const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const BitcoinClient = require('bitcoin-core');
const WebSocket = require('ws');
const zmq = require('zeromq');
const http = require('http');
const path = require('path');
const bip39 = require('bip39');

// RPC client configuration
const rpcClient = new BitcoinClient({
  network: process.env.ADONAI_NETWORK || 'regtest',
  username: process.env.RPC_USER || 'user',
  password: process.env.RPC_PASSWORD || 'pass',
  port: Number(process.env.RPC_PORT || 18443),
});

function getWalletClient(wallet) {
  return new BitcoinClient({
    network: process.env.ADONAI_NETWORK || 'regtest',
    username: process.env.RPC_USER || 'user',
    password: process.env.RPC_PASSWORD || 'pass',
    port: Number(process.env.RPC_PORT || 18443),
    wallet,
  });
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Security middleware
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

// Sessions + CSRF
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'adonai-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict' },
});
app.use(sessionMiddleware);
const csrfProtection = csrf();

// Rate limiters
const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });

// Auth helper
function requireAuth(req, res, next) {
  if (req.session.user) return next();
  res.status(401).json({ error: 'unauthorized' });
}

// Login endpoint
app.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  const valid =
    username === (process.env.GATEWAY_USER || 'admin') &&
    password === (process.env.GATEWAY_PASSWORD || 'password');
  if (valid) {
    req.session.user = username;
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'invalid credentials' });
  }
});

app.get('/csrf-token', requireAuth, csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// RPC whitelist
const RPC_WHITELIST = [
  'getblockchaininfo',
  'getnetworkinfo',
  'getmininginfo',
  'gettransaction',
  'listtransactions',
  'decoderawtransaction',
  'getblocktemplate',
  'getpeerinfo',
  'getrawmempool',
  'getblock',
  'getblockhash',
  'getblockcount',
  'generatetoaddress',
  'setgenerate',
  'stop',
  'logging',
  'getbalance',
  'listunspent',
  'getnewaddress',
  'sendtoaddress',
];

// REST -> RPC mapping
app.post('/api/:method', apiLimiter, requireAuth, csrfProtection, async (req, res) => {
  const method = req.params.method;
  if (!RPC_WHITELIST.includes(method)) {
    return res.status(400).json({ error: 'method not allowed' });
  }
  try {
    const params = Array.isArray(req.body) ? req.body : Object.values(req.body || {});
    const result = await rpcClient.command([{ method, parameters: params }]);
    res.json(result[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Explicit REST endpoints for frontend
app.get('/api/peers', apiLimiter, requireAuth, async (_req, res) => {
  try {
    const peers = await rpcClient.command('getpeerinfo');
    res.json(
      peers.map((p) => ({
        id: p.id,
        address: p.addr,
        ping: p.pingtime,
        type: p.connection_type || (p.inbound ? 'inbound' : 'outbound'),
      })),
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/mempool', apiLimiter, requireAuth, async (_req, res) => {
  try {
    const txids = await rpcClient.command('getrawmempool');
    res.json(txids.map((txid) => ({ txid })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/blocks', apiLimiter, requireAuth, async (_req, res) => {
  try {
    const height = await rpcClient.command('getblockcount');
    const blocks = [];
    const count = Math.min(height + 1, 10);
    for (let i = 0; i < count; i++) {
      const h = height - i;
      const hash = await rpcClient.command('getblockhash', h);
      const block = await rpcClient.command('getblock', hash);
      blocks.push({ hash: block.hash, height: block.height, txs: block.tx });
    }
    res.json(blocks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/miner/start', apiLimiter, requireAuth, csrfProtection, async (req, res) => {
  try {
    await rpcClient.command('setgenerate', true, 1);
    res.json({ started: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/miner/stop', apiLimiter, requireAuth, csrfProtection, async (_req, res) => {
  try {
    await rpcClient.command('setgenerate', false);
    res.json({ stopped: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Wallet endpoints
app.post(
  '/wallets/init',
  apiLimiter,
  requireAuth,
  csrfProtection,
  async (req, res) => {
    const { mnemonic } = req.body || {};
    if (!mnemonic || !bip39.validateMnemonic(mnemonic)) {
      return res.status(400).json({ error: 'invalid mnemonic' });
    }
    const seed = bip39.mnemonicToSeedSync(mnemonic).toString('hex');
    const walletName = 'adonai';
    try {
      await rpcClient.command('createwallet', walletName, false, true);
    } catch (e) {
      if (!e.message.includes('already exists')) {
        return res.status(500).json({ error: e.message });
      }
    }
    const wClient = getWalletClient(walletName);
    try {
      await wClient.command('sethdseed', true, seed);
      res.json({ name: walletName, loaded: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.get('/wallets/:wallet/balance', apiLimiter, requireAuth, async (req, res) => {
  const client = getWalletClient(req.params.wallet);
  try {
    const balance = await client.command('getbalance');
    res.json({ balance });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/wallets/:wallet/utxos', apiLimiter, requireAuth, async (req, res) => {
  const client = getWalletClient(req.params.wallet);
  try {
    const utxos = await client.command('listunspent');
    res.json(utxos.map((u) => ({ txid: u.txid, vout: u.vout, amount: u.amount })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/wallets/:wallet/transactions', apiLimiter, requireAuth, async (req, res) => {
  const client = getWalletClient(req.params.wallet);
  try {
    const txs = await client.command('listtransactions', '*', 50);
    res.json(
      txs.map((t) => ({ txid: t.txid, amount: t.amount, confirmations: t.confirmations })),
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post(
  '/wallets/:wallet/newaddress',
  apiLimiter,
  requireAuth,
  csrfProtection,
  async (req, res) => {
    const client = getWalletClient(req.params.wallet);
    try {
      const address = await client.command('getnewaddress');
      res.json({ address });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
);

app.post(
  '/wallets/:wallet/sendtoaddress',
  apiLimiter,
  requireAuth,
  csrfProtection,
  async (req, res) => {
    const client = getWalletClient(req.params.wallet);
    const { address, amount } = req.body || {};
    try {
      const txid = await client.command('sendtoaddress', address, amount);
      res.json({ txid });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
);

// Serve OpenAPI spec for clients
app.get('/openapi.yaml', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'openapi.yaml'));
});

// WebSocket event subscriptions
function broadcast(event, data) {
  const payload = JSON.stringify({ event, data });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.subscriptions?.has(event)) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  ws.subscriptions = new Set();
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.subscribe) ws.subscriptions.add(data.subscribe);
    } catch (_) {
      // ignore malformed messages
    }
  });
});

// Periodic miner state broadcast
async function pollMiner() {
  try {
    const [info] = await rpcClient.command([{ method: 'getmininginfo', parameters: [] }]);
    const isMining = info.generating || info.generate || false;
    const hashrate = info.hashespersec || info.networkhashps || 0;
    broadcast('miner', { isMining, hashrate });
  } catch (e) {
    // swallow errors to avoid noisy logs when daemon is unavailable
  }
}
pollMiner();
setInterval(pollMiner, 5000);

// ZMQ subscriptions for block/tx events
async function initZmq() {
  const sock = new zmq.Subscriber();
  try {
    sock.connect(process.env.ZMQ_BLOCK || 'tcp://127.0.0.1:28332');
    sock.connect(process.env.ZMQ_TX || 'tcp://127.0.0.1:28333');
    sock.subscribe('hashblock');
    sock.subscribe('hashtx');
    for await (const [topic, msg] of sock) {
      const event = topic.toString();
      const data = { hash: msg.toString('hex') };
      if (event === 'hashblock') broadcast('newBlock', data);
      if (event === 'hashtx') broadcast('newTx', { txid: data.hash });
    }
  } catch (e) {
    console.error('ZMQ disabled:', e.message);
  }
}
initZmq();

const PORT = Number(process.env.PORT || 17001);
server.listen(PORT, () => {
  console.log(`Gateway listening on ${PORT}`);
});
