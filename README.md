# Proyecto ADONAI - Nodo Blockchain con PoW BLAKE3

ADONAI es un fork de Bitcoin Core con algoritmo PoW modificado a **BLAKE3**.  
Este repositorio incluye parámetros de red propios y el bloque génesis ya fijado.

> **Licencia:** MIT. Este proyecto preserva los avisos de copyright de Bitcoin Core y añade los de ADONAI.  
> **Aviso:** No afiliado ni respaldado por Bitcoin Core. Las marcas de terceros pertenecen a sus respectivos dueños.

---

## 1. Compilación

```bash
cd ~/adonai/adonai
mkdir -p build && cd build
cmake ..
make -j$(nproc)
```

Binarios resultantes:
```
build/bin/adonaid
build/bin/adonai-cli
```

---

## 2. Configuración

Crear directorio de datos y fichero de configuración:

```bash
mkdir -p /home/angel/.adonai
nano /home/angel/.adonai/adonai.conf
```

Contenido mínimo de `adonai.conf` (puertos propios de ADONAI):

```ini
daemon=1
server=1
listen=1
txindex=1
logtimestamps=1
maxconnections=64

# Puertos ADONAI
port=18444        # P2P
rpcport=18443     # RPC

# RPC local
rpcbind=127.0.0.1
rpcallowip=127.0.0.1
rpcuser=usuario_rpc
rpcpassword=contraseña_rpc_segura
```

> Si editas desde Windows, normaliza saltos de línea:  
> `sed -i 's/\r$//' /home/angel/.adonai/adonai.conf`

---

## 3. Ejecución del nodo

Inicia en segundo plano:

```bash
cd ~/adonai/adonai/build
./bin/adonaid -daemon -conf=/home/angel/.adonai/adonai.conf -datadir=/home/angel/.adonai
```

Ver logs en tiempo real (opcional):
```bash
tail -n 200 -f /home/angel/.adonai/debug.log
```

---

## 4. Verificación del génesis

```bash
./bin/adonai-cli -conf=/home/angel/.adonai/adonai.conf -datadir=/home/angel/.adonai getblockhash 0
```

Debe devolver:

```
4c4efcd0ae575f920e8fb827b9d4ccb552d53ab573726afa6788394bb2753492
```

Más información de la cadena:

```bash
./bin/adonai-cli -conf=/home/angel/.adonai/adonai.conf -datadir=/home/angel/.adonai getblockchaininfo
```

---

## 5. Parar el nodo

```bash
./bin/adonai-cli -conf=/home/angel/.adonai/adonai.conf -datadir=/home/angel/.adonai stop
```

---

## 6. Política monetaria

La emisión de ADONAI sigue una política de halving similar a la de Bitcoin:

- **Subsidio inicial:** 18 ADO por bloque.
- **Halving:** cada 2 803 200 bloques (~4 años).
- **Tope máximo:** 100 915 200 ADO en total.
- **Emisión primer año:** ~12,61 millones de ADO.
- **Duración prevista:** ~124 años (31 reducciones).

## 7. Parámetros del génesis

Consulta `GENESIS.adonai.txt` (inclúyelo en la raíz del repo).
Contiene:
- Hash génesis: `4c4efcd0ae575f920e8fb827b9d4ccb552d53ab573726afa6788394bb2753492`
- Merkle root: `3c27610446c91576f0f18fa4e758b72565f678ae063346fe6d271d6d850783b6`
- nTime: `1754122572`
- nNonce: `2`
- nBits: `0x207fffff`
- Magic bytes: `AD 0E A1 01`
- Puertos: `P2P 18444`, `RPC 18443`
- HRP Bech32: `ad`
- Prefijos Base58: pub=23, script=83, secret=153

---

## 8. Licencia

Este repositorio se publica bajo **MIT**. Consulta el archivo [`LICENSE`](LICENSE) para los términos completos.  
Mantén los avisos de copyright originales de Bitcoin Core al redistribuir.

---

© 2025 ADONAI contributors
