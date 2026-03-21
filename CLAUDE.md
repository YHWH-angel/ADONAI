# ADONAI — Claude Code Context

## Qué es ADONAI

Blockchain node derivado de Bitcoin Core con las siguientes modificaciones clave:

- **Algoritmo PoW**: BLAKE3 (en lugar de SHA-256)
- **Lenguaje núcleo**: C++20
- **Interfaz web**: Next.js PWA + Fastify API (monorepo en `web/`)
- **Moneda**: ADO · Suministro máximo: 100,915,200 ADO
- **Red P2P**: puerto `18444` · RPC: puerto `18443`
- **Prefijo bech32**: `ad` → las direcciones comienzan con `ad1...`

---

## Estructura del repositorio

```
ADONAI/
├── src/                    # Código C++ del nodo
│   ├── blake3/             # Implementación BLAKE3 con SIMD (SSE2/AVX2)
│   ├── consensus/          # Reglas de consenso y validación
│   ├── wallet/             # Wallet con backend SQLite
│   ├── rpc/                # Servidor JSON-RPC
│   ├── net/                # Red P2P
│   ├── node/               # Gestión del nodo (chainstate, mempool)
│   ├── script/             # Intérprete de scripts
│   ├── crypto/             # Utilidades criptográficas
│   └── secp256k1/          # Librería EC (subtree)
├── web/                    # Monorepo TypeScript (ver web/CLAUDE.md)
├── test/
│   ├── functional/         # 252 pruebas Python de integración
│   └── fuzz/               # Fuzzing con libFuzzer
├── doc/                    # Documentación (build, RPC, fee model, PoW)
├── cmake/                  # Módulos CMake
├── depends/                # Gestión de dependencias externas
└── CMakeLists.txt          # Sistema de build principal
```

---

## Compilación (Ubuntu/Debian)

### 1. Instalar dependencias del sistema

```bash
sudo apt-get update
sudo apt-get install -y \
  build-essential cmake pkgconf python3 \
  libevent-dev libboost-dev libsqlite3-dev \
  libzmq3-dev ccache
```

### 2. Compilar (build estándar)

```bash
cd ~/adonai/adonai          # o la ruta donde esté el repo
mkdir -p build && cd build
cmake ..
make -j$(nproc)
```

Los binarios quedan en `build/bin/`:
```
adonaid        → daemon principal
adonai-cli     → cliente RPC
adonai-tx      → herramienta de transacciones
adonai-util    → utilidades
adonai-wallet  → herramienta de wallet (si ENABLE_WALLET=ON)
```

### 3. Opciones de CMake más usadas

```bash
# Build con todas las features (desarrollo)
cmake -B build \
  -DCMAKE_BUILD_TYPE=RelWithDebInfo \
  -DWITH_CCACHE=ON \
  -DBUILD_TESTS=ON \
  -DENABLE_WALLET=ON

# Build mínimo rápido (sin tests ni wallet)
cmake -B build \
  -DBUILD_TESTS=OFF \
  -DENABLE_WALLET=OFF

# Build con soporte ZeroMQ
cmake -B build -DWITH_ZMQ=ON

# En sistemas con poca RAM (reduce uso de memoria del compilador)
cmake -B build \
  -DCMAKE_CXX_FLAGS="--param ggc-min-expand=1 --param ggc-min-heapsize=32768"
```

---

## Ejecutar el nodo

### Configuración mínima (~/.adonai/adonai.conf)

```ini
daemon=1
server=1
listen=1
txindex=1
logtimestamps=1
maxconnections=64

port=18444
rpcport=18443

rpcbind=127.0.0.1
rpcallowip=127.0.0.1
rpcuser=adonai
rpcpassword=CAMBIA_ESTO_POR_PASSWORD_FUERTE
```

### Iniciar / detener el nodo

```bash
# Iniciar
./build/bin/adonaid -daemon -conf=$HOME/.adonai/adonai.conf -datadir=$HOME/.adonai

# Verificar que funciona (bloque génesis)
./build/bin/adonai-cli -conf=$HOME/.adonai/adonai.conf getblockhash 0
# Debe devolver: 000008358709fae09230a75838c2c30b15eff28790d530c2d8b0fd5739e0cd06

# Ver info de la blockchain
./build/bin/adonai-cli getblockchaininfo

# Ver logs en tiempo real
tail -f ~/.adonai/debug.log

# Detener
./build/bin/adonai-cli stop
```

---

## Modelo de comisiones (híbrido)

`fee = α·weight + β·value`

| Parámetro | Valor por defecto |
|-----------|------------------|
| α (por peso) | 0.000001 ADO/kvB |
| β (por valor) | 0.000005 (0.0005%) |
| Mínimo | 0.000001 ADO |
| Máximo | 0.01 ADO |

```bash
# Consultar modelo activo
adonai-cli getfeemodel

# Ajustar parámetros en caliente
adonai-cli setfeemodel 0.000002 0.000007 0.000001 0.01
```

---

## Parámetros de red

| Parámetro | Valor |
|-----------|-------|
| P2P port | 18444 |
| RPC port | 18443 |
| Magic bytes | AD 0E A1 01 |
| Bech32 HRP | `ad` |
| Bloque génesis hash | `000008358709fae09230a75838c2c30b15eff28790d530c2d8b0fd5739e0cd06` |
| Génesis timestamp | 1754122572 |
| Tiempo de bloque objetivo | ~45 segundos |
| Subsideo inicial | 18 ADO/bloque |
| Halving cada | 2,803,200 bloques (~4 años) |
| Supply máximo | 100,915,200 ADO |

---

## Tests

```bash
# Tests unitarios C++
./build/bin/test_adonai

# Test funcional individual
python3 test/functional/feature_rbf.py

# Suite completa
python3 test/functional/test_runner.py

# Suite extendida
python3 test/functional/test_runner.py --extended
```

---

## Modificaciones respecto a Bitcoin Core

1. **PoW**: `src/blake3/` — BLAKE3 reemplaza SHA-256d. Ver `doc/pow.md`
2. **Génesis**: parámetros propios en `src/chainparams.cpp`
3. **Comisiones**: modelo híbrido `α·w + β·v`. Ver `doc/feemodel.md`
4. **Red**: ports, magic bytes y prefijos de dirección propios
5. **Web wallet**: `web/` — no existe en Bitcoin Core. Ver `web/CLAUDE.md`

---

## Documentación relevante

| Fichero | Contenido |
|---------|-----------|
| `doc/build-unix.md` | Build en Linux |
| `doc/build-osx.md` | Build en macOS |
| `doc/feemodel.md` | Modelo de comisiones |
| `doc/pow.md` | Prueba de trabajo BLAKE3 |
| `doc/JSON-RPC-interface.md` | Referencia de endpoints RPC |
| `doc/developer-notes.md` | Guía para desarrolladores |
| `doc/fuzzing.md` | Infraestructura de fuzzing |
| `web/CLAUDE.md` | Contexto de la web wallet |
