# ADONAI Web Wallet — Claude Code Context

## Arquitectura

Monorepo **pnpm workspaces** + **Turborepo** con tres paquetes:

```
web/
├── apps/
│   ├── frontend/     → Next.js 14 PWA (puerto 3000)
│   └── api/          → Fastify bridge RPC (puerto configurable en .env)
└── packages/
    └── rpc-client/   → Librería TS compartida para llamadas RPC al nodo
```

---

## Frontend (`apps/frontend/`)

| Tech | Versión |
|------|---------|
| Next.js | 14.2.x (App Router) |
| React | 18.3.x |
| TailwindCSS | 3.x |
| Zustand | 4.x (estado global) |

### Páginas

| Ruta | Fichero | Función |
|------|---------|---------|
| `/` | `src/app/page.tsx` | Dashboard — saldo, últimas tx |
| `/wallet/create` | `src/app/wallet/create/page.tsx` | Crear wallet HD |
| `/receive` | `src/app/receive/page.tsx` | Mostrar dirección + QR |
| `/send` | `src/app/send/page.tsx` | Enviar ADO |
| `/transactions` | `src/app/transactions/page.tsx` | Historial de transacciones |
| `/mining` | `src/app/mining/page.tsx` | Control de minería |
| `/settings` | `src/app/settings/page.tsx` | Configuración del nodo |

### Librerías clave del frontend

```
src/lib/wallet-core.ts   → BIP39 + BIP32 HD wallet (puro TS, sin WASM)
src/lib/api.ts           → Cliente HTTP hacia apps/api
src/store/wallet.ts      → Estado global Zustand
src/components/layout/   → TopBar, BottomNav, Providers
src/components/ui/       → button, card, input, badge
```

### Wallet core (sin WebAssembly)

Usa librerías `@scure` y `@noble` — **puro TypeScript, sin WASM**:

```typescript
import { generateMnemonic, validateMnemonic, deriveAddress,
         encryptMnemonic, decryptMnemonic } from '@/lib/wallet-core';

// Generar mnemónico BIP39 (24 palabras por defecto)
const mnemonic = generateMnemonic(24);

// Derivar dirección (BIP84 m/84'/0'/0'/0/index)
// Prefijo bech32 'ad' → dirección ad1...
const { address, publicKey, path } = deriveAddress(mnemonic, 0);

// Cifrar/descifrar con AES-256-GCM (Web Crypto API)
const encrypted = await encryptMnemonic(mnemonic, password);
const recovered  = await decryptMnemonic(encrypted, password);
```

### Variables de entorno del frontend

```bash
# apps/frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Comandos del frontend

```bash
cd web/apps/frontend
pnpm dev      # Servidor de desarrollo
pnpm build    # Build de producción
pnpm start    # Servidor de producción (requiere build)
pnpm lint     # Linting
```

---

## API (`apps/api/`)

Servidor **Fastify** que actúa de proxy entre el frontend y el nodo `adonaid` via JSON-RPC.

### Rutas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/blockchain/info` | `getblockchaininfo` |
| GET | `/network/info` | `getnetworkinfo` |
| GET | `/wallet/balance` | `getbalance` |
| GET | `/wallet/address` | `getnewaddress` |
| POST | `/wallet/send` | `sendtoaddress` |
| GET | `/wallet/transactions` | `listtransactions` |
| WS | `/ws` | Actualizaciones en tiempo real |

### Variables de entorno de la API

```bash
# apps/api/.env  (copia de .env.example)
PORT=3001
NODE_RPC_URL=http://127.0.0.1:18443
NODE_RPC_USER=adonai
NODE_RPC_PASSWORD=CAMBIA_ESTO
JWT_SECRET=CAMBIA_ESTO_TAMBIEN
CORS_ORIGIN=http://localhost:3000
```

### Comandos de la API

```bash
cd web/apps/api
cp .env.example .env   # Primera vez
pnpm dev               # Desarrollo con tsx watch
pnpm build             # Compilar TypeScript
pnpm start             # Producción
```

---

## RPC Client (`packages/rpc-client/`)

Librería compartida con tipado completo de los endpoints del nodo ADONAI.

```typescript
import { AdonaiRpcClient } from '@adonai/rpc-client';

const client = new AdonaiRpcClient({
  url: 'http://127.0.0.1:18443',
  username: 'adonai',
  password: 'password',
});

const info = await client.getBlockchainInfo();
const balance = await client.getBalance();
```

**Nota**: usa JSON-RPC 1.0 (el nodo no acepta 1.1).

---

## Arrancar todo el stack web

```bash
cd web
pnpm install         # Instalar dependencias (primera vez)
pnpm dev             # Arranca frontend + API en paralelo
```

Requiere que el nodo `adonaid` esté corriendo con RPC habilitado.

---

## Dependencias importantes

| Paquete | Motivo |
|---------|--------|
| `@scure/bip32` | Derivación HD sin WASM |
| `@scure/bip39` | Mnemonics BIP39 sin WASM |
| `@scure/base` | Codificación bech32 |
| `@noble/hashes` | SHA256 + RIPEMD160 puros TS |
| `qrcode.react` | QR de direcciones |
| `zustand` | Estado global de la wallet |

**No usar**: `tiny-secp256k1`, `bip32`, `bip39`, `bitcoinjs-lib` — todos usan WASM incompatible con Next.js SSR.

---

## Convenciones

- Todos los componentes de página llevan `'use client'` al inicio.
- Los colores del tema están en `src/app/globals.css` (variables CSS).
- El token/divisa se muestra siempre como `ADO` con 8 decimales.
- Las direcciones ADONAI empiezan siempre por `ad1`.
