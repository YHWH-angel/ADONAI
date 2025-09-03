interface WSOptions {
  reconnectInterval?: number
  onOpen?: () => void
  onClose?: () => void
  onError?: (e: Event) => void
}

type MessageHandler = (payload: unknown) => void

export class WSClient {
  private url: string
  private ws?: WebSocket
  private reconnectInterval: number
  private handlers = new Map<string, MessageHandler>()
  private opts: WSOptions

  constructor(url: string, opts: WSOptions = {}) {
    this.url = url
    this.reconnectInterval = opts.reconnectInterval ?? 1000
    this.opts = opts
    this.connect()
  }

  private connect() {
    this.ws = new WebSocket(this.url)
    this.ws.addEventListener('open', () => this.opts.onOpen?.())
    this.ws.addEventListener('close', () => {
      this.opts.onClose?.()
      setTimeout(() => this.connect(), this.reconnectInterval)
    })
    this.ws.addEventListener('error', (e) => this.opts.onError?.(e))
    this.ws.addEventListener('message', (ev) => {
      try {
        const { type, payload } = JSON.parse(ev.data)
        const handler = this.handlers.get(type)
        handler?.(payload)
      } catch (err) {
        console.error('WS message error:', err)
      }
    })
  }

  on(type: string, handler: MessageHandler) {
    this.handlers.set(type, handler)
  }

  off(type: string) {
    this.handlers.delete(type)
  }

  send(type: string, payload: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    }
  }

  close() {
    this.ws?.close()
  }
}
