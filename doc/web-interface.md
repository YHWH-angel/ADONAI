# ADONAI Web Interface

La interfaz web proporciona un modo moderno de interactuar con un nodo ADONAI a través de un *Single Page Application* (SPA) servida desde un gateway local. Esta funcionalidad replica la interfaz QT del proyecto original, pero usando tecnologías web.

## Arquitectura

```
adonaid (JSON-RPC) ↔ Gateway Node.js ↔ REST + WebSocket ↔ React SPA
```

- **Gateway RPC local:** servicio en Node.js que traduce las llamadas JSON-RPC del demonio `adonaid` a un API REST. Además emite eventos de bloque y transacción mediante WebSocket.
- **Frontend SPA:** aplicación React servida por el propio gateway, evitando CORS al compartir el mismo origen.
- **Puertos por defecto:**
  - REST: `17001`
  - P2P: `17002`
  - Directorio de datos: `~/.adonai`
- **Seguridad:** acceso restringido a `localhost` y autenticación mediante cookie `HttpOnly` con token local. Las solicitudes modificadoras deben incluir el encabezado `X-CSRF-Token`.

## Contrato REST

El contrato OpenAPI de la pasarela se encuentra en [`openapi.yaml`](../openapi.yaml). Resume los siguientes grupos de endpoints:

### Nodo / Red
- `GET /blockchain/info`
- `GET /network/info`
- `GET /mining/info`
- `GET /network/connectioncount`
- `GET /node/uptime`

### Wallet
- `GET /wallets` – listar billeteras cargadas.
- `POST /wallets` – crear nueva billetera.
- `POST /wallets/load` – cargar billetera existente.
- `GET /wallets/{wallet}/balance`
- `GET /wallets/{wallet}/newaddress`
- `GET /wallets/{wallet}/transactions`
- `POST /wallets/{wallet}/sendtoaddress`
- `POST /wallets/{wallet}/unlock`
- `POST /wallets/{wallet}/lock`

### Mempool / Transacciones
- `GET /mempool`
- `GET /transactions/{txid}`
- `POST /transactions/decode`

### Minería
- `GET /mining/blocktemplate`
- `POST /mining/toggle`

### Sistema
- `POST /node/stop`
- `POST /node/logging`

## Flujo típico

1. El usuario abre la SPA en `http://localhost:17001`.
2. El gateway autentica mediante cookie y entrega un token CSRF.
3. El frontend consume el API REST descrito anteriormente y se suscribe por WebSocket a eventos de nuevos bloques y transacciones.

Para más detalles sobre los campos de cada respuesta y parámetros aceptados, consulte el fichero [`openapi.yaml`](../openapi.yaml).
