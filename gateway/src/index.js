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
const fs = require('fs');
const os = require('os');
const path = require('path');

// RPC client configuration
const rpcClient = new BitcoinClient({
  network: process.env.ADONAI_NETWORK || 'regtest',
  username: process.env.RPC_USER || 'user',
  password: process.env.RPC_PASSWORD || 'pass',
  port: Number(process.env.RPC_PORT || 18443),
});

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
    res.json({ ok: true, csrfToken: req.csrfToken ? req.csrfToken() : undefined });
  } else {
    res.status(401).json({ error: 'invalid credentials' });
  }
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
  'setgenerate',
  'stop',
  'logging',
  'getnewaddress',
  'sendtoaddress',
  'dumpwallet',
  'importwallet',
  'getbalance',
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

// Wallet export
app.get('/api/exportwallet', apiLimiter, requireAuth, async (_req, res) => {
  try {
    const tmp = path.join(os.tmpdir(), 'wallet-export.dat');
    const [{ result }] = await rpcClient.command([
      { method: 'dumpwallet', parameters: [tmp] },
    ]);
    res.download(result.filename, 'wallet.dat', (err) => {
      fs.unlink(result.filename, () => {});
      if (err) console.error('export download error', err);
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Wallet import
app.post('/api/importwallet', apiLimiter, requireAuth, async (req, res) => {
  try {
    const content = req.body?.content;
    if (!content) return res.status(400).json({ error: 'missing content' });
    const tmp = path.join(os.tmpdir(), 'wallet-import.dat');
    fs.writeFileSync(tmp, content, 'utf8');
    const result = await rpcClient.command([
      { method: 'importwallet', parameters: [tmp] },
    ]);
    fs.unlink(tmp, () => {});
    res.json(result[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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
