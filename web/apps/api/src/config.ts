export const config = {
  port: parseInt(process.env.PORT ?? '3001'),
  host: process.env.HOST ?? '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET ?? 'change-this-secret-in-production',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',').map((s) => s.trim()),

  rpc: {
    url: process.env.RPC_URL ?? 'http://127.0.0.1:18443',
    username: process.env.RPC_USER ?? 'adonairpc',
    password: process.env.RPC_PASSWORD ?? 'adonairpc',
  },

  // Block polling interval for WebSocket events (ms)
  blockPollInterval: parseInt(process.env.BLOCK_POLL_INTERVAL ?? '5000'),
};
