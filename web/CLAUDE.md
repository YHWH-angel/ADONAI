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

Hay dos modos de wallet:
- **Modo nodo** (`/`, `/send`, `/receive`, `/transactions`, `/mining`) — requiere nodo `adonaid` propio con wallet cargada
- **Modo ligero** (`/light/*`) — sin nodo propio; firma las transacciones en el navegador y las emite a través del nodo público del servidor

---

## Frontend (`apps/frontend/`)

| Tech | Versión |
|------|---------|
| Next.js | 14.2.x (App Router) |
| React | 18.3.x |
| TailwindCSS | 3.x |
| Zustand | 4.x (estado global) |

### Páginas — Modo nodo

| Ruta | Fichero | Función |
|------|---------|---------|
| `/` | `src/app/page.tsx` | Dashboard — saldo, últimas tx, estado de red |
| `/wallet/create` | `src/app/wallet/create/page.tsx` | Crear wallet HD |
| `/receive` | `src/app/receive/page.tsx` | Mostrar dirección + QR |
| `/send` | `src/app/send/page.tsx` | Enviar ADO (firma en nodo) |
| `/transactions` | `src/app/transactions/page.tsx` | Historial de transacciones |
| `/mining` | `src/app/mining/page.tsx` | Control de minería |
| `/settings` | `src/app/settings/page.tsx` | Configuración del nodo |
| `/help` | `src/app/help/page.tsx` | Guía para principiantes |

### Páginas — Modo ligero (light wallet)

| Ruta | Fichero | Función |
|------|---------|---------|
| `/light` | `src/app/light/page.tsx` | Conectar wallet con mnemónico (24 palabras) |
| `/light/wallet` | `src/app/light/wallet/page.tsx` | Dashboard saldo + UTXOs |
| `/light/send` | `src/app/light/send/page.tsx` | Enviar ADO (firma client-side P2WPKH) |
| `/light/receive` | `src/app/light/receive/page.tsx` | Mostrar dirección derivada + QR |

### Librerías clave del frontend

```
src/lib/wallet-core.ts   → BIP39 + BIP32 + P2WPKH signing (puro TS, sin WASM)
src/lib/api.ts           → Cliente HTTP hacia apps/api
src/store/wallet.ts      → Estado global Zustand (modo nodo)
src/store/lightWallet.ts → Estado global Zustand (modo ligero)
src/components/layout/   → SideNav, MobileNav, LangSwitcher
src/components/ui/       → button, card, input, badge
src/hooks/useActiveWallet.ts → Resuelve la wallet activa (nodo)
src/hooks/useLocale.ts   → i18n ES/EN con Zustand
src/lib/i18n.ts          → Traducciones ES/EN
```

### wallet-core.ts — funciones disponibles

```typescript
// BIP39 / BIP32
generateMnemonic(wordCount)          // 12 o 24 palabras
validateMnemonic(mnemonic)           // boolean
deriveAddress(mnemonic, index)       // → { address, publicKey, path }
getXpub(mnemonic)                    // xpub en m/84'/0'/0'

// Light wallet
getDescriptors(mnemonic)             // → { receive, change, xpub }
deriveKeyAtIndex(mnemonic, index, isChange) // → { privateKey, publicKey, address }
parseDescPath(desc)                  // parsea index/isChange del campo desc de scantxoutset
buildAndSignTx(params)               // construye y firma tx P2WPKH segwit → hex
estimateLightFee(alpha, beta, min, amount, numInputs) // estima comisión

// Cifrado
encryptMnemonic(mnemonic, password)  // AES-256-GCM → base64
decryptMnemonic(encrypted, password) // → mnemónico en texto
```

### Variables de entorno del frontend

```bash
# apps/frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

### Comandos del frontend

```bash
cd web/apps/frontend
pnpm dev      # Servidor de desarrollo
pnpm build    # Build de producción
pnpm start    # Servidor de producción (requiere build)
pnpm type-check  # Verificación de tipos TypeScript
```

---

## API (`apps/api/`)

Servidor **Fastify** que actúa de proxy entre el frontend y el nodo `adonaid` via JSON-RPC.

### Rutas — Blockchain

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/blockchain/info` | `getblockchaininfo` |
| GET | `/api/v1/blockchain/stats` | Info combinada blockchain+mining+network |
| GET | `/api/v1/blockchain/tx/:txid` | Transacción completa |
| GET | `/api/v1/blockchain/block/:hash` | Bloque completo |
| GET | `/api/v1/blockchain/block-by-height/:height` | Bloque por altura |

### Rutas — Wallet (modo nodo)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/wallet/list` | Wallets cargadas |
| GET | `/api/v1/wallet/:name/info` | Saldo + info |
| POST | `/api/v1/wallet/:name/address` | Nueva dirección |
| GET | `/api/v1/wallet/:name/transactions` | Historial |
| GET | `/api/v1/wallet/:name/utxos` | UTXOs |
| POST | `/api/v1/wallet/:name/send` | Enviar ADO |
| POST | `/api/v1/wallet/broadcast` | Emitir tx raw |
| GET | `/api/v1/wallet/fee-estimate` | Estimar comisión |
| GET | `/api/v1/wallet/validate/:address` | Validar dirección |

### Rutas — Light wallet

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/light/scan` | `scantxoutset` con xpub → UTXOs + balance |
| POST | `/api/v1/light/broadcast` | Emitir tx raw firmada cliente |

`/light/scan` acepta `{ xpub, receiveRange?, changeRange? }` y escanea las primeras 200 direcciones de recepción y 50 de cambio sin necesitar wallet cargada en el nodo.

### Rutas — Mining

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/mining/status` | Estado del minero |
| POST | `/api/v1/mining/start` | Iniciar minado continuo |
| POST | `/api/v1/mining/stop` | Detener minado |
| POST | `/api/v1/mining/mine-blocks` | Minar N bloques |

### Variables de entorno de la API

```bash
# apps/api/.env
PORT=3001
RPC_URL=http://127.0.0.1:18443
RPC_USER=adonai
RPC_PASSWORD=CAMBIA_ESTO
CORS_ORIGIN=http://localhost:3000,http://192.168.1.X:3000
BLOCK_POLL_INTERVAL=5000
```

### Comandos de la API

```bash
cd web/apps/api
pnpm dev               # Desarrollo con tsx watch
pnpm build             # Compilar TypeScript
pnpm start             # Producción
```

---

## RPC Client (`packages/rpc-client/`)

Librería compartida con tipado completo de los endpoints del nodo ADONAI.

### Métodos disponibles

```typescript
// Blockchain
getBlockchainInfo(), getBlockCount(), getBlock(hash, verbosity)
getRawTransaction(txid, verbose), sendRawTransaction(hex)

// Wallet
getBalance(minConf), getWalletInfo(), getNewAddress()
listTransactions(label, count, skip), listUnspent(minConf, maxConf, addresses)
sendToAddress(address, amount, options), importDescriptors(requests)
createWallet(name, disablePrivateKeys, blank, ...)

// Light wallet
scantxoutset(action, scanobjects)   // escanea UTXOs de cualquier dirección/xpub

// Mining
getMiningInfo(), generateToAddress(n, address)

// Red y fees
getNetworkInfo(), getPeerInfo(), getFeeModel(), validateAddress(address)
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
| `@noble/curves` | secp256k1 ECDSA signing (light wallet) |
| `qrcode.react` | QR de direcciones |
| `zustand` | Estado global de la wallet |

**No usar**: `tiny-secp256k1`, `bip32`, `bip39`, `bitcoinjs-lib` — todos usan WASM incompatible con Next.js SSR.

---

## Convenciones

- Todos los componentes de página llevan `'use client'` al inicio.
- Los colores del tema están en `src/app/globals.css` (variables CSS).
- El token/divisa se muestra siempre como `ADO` con 8 decimales.
- Las direcciones ADONAI empiezan siempre por `ad1`.
- i18n: `useT()` devuelve el objeto de traducciones según el locale activo (ES/EN).
- La light wallet guarda el mnemónico solo en memoria (Zustand sin persist) — se borra al cerrar la pestaña.
