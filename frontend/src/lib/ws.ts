import { WS_BASE_URL } from './constants'

export type MessageHandler = (event: MessageEvent) => void

export class WSClient {
  private url: string
  private socket?: WebSocket
  private handler?: MessageHandler
  private retry = 1000

  constructor(url: string = WS_BASE_URL, handler?: MessageHandler) {
    this.url = url
    this.handler = handler
    this.connect()
  }

  private connect() {
    this.socket = new WebSocket(this.url)
    this.socket.onopen = () => {
      this.retry = 1000
    }
    this.socket.onmessage = (e) => this.handler?.(e)
    this.socket.onclose = () => this.reconnect()
    this.socket.onerror = () => this.socket?.close()
  }

  private reconnect() {
    setTimeout(() => this.connect(), this.retry)
    this.retry = Math.min(this.retry * 2, 10000)
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    this.socket?.send(data)
  }

  close() {
    this.socket?.close()
  }
}
