import type { StateCreator } from 'zustand'

export interface NodeSlice {
  height: number
  difficulty: number
  netHashrate: number
  setHeight: (height: number) => void
  setDifficulty: (difficulty: number) => void
  setNetHashrate: (hashrate: number) => void
}

export interface WalletSlice {
  balance: number
  transactions: Tx[]
  address: string
  utxos: Utxo[]
  setBalance: (balance: number) => void
  setTransactions: (txs: Tx[]) => void
  setAddress: (address: string) => void
  setUtxos: (utxos: Utxo[]) => void
}

export interface Utxo {
  txid: string
  vout: number
  amount: number
}

export interface Tx {
  txid: string
  amount: number
  confirmations?: number
}

export interface MiningSlice {
  isMining: boolean
  minerHashrate: number
  setIsMining: (isMining: boolean) => void
  setMinerHashrate: (hashrate: number) => void
  mode: 'solo' | 'pool'
  setMode: (mode: 'solo' | 'pool') => void
}

export interface SettingsSlice {
  darkMode: boolean
  datadir: string
  logsPath: string
  verbosity: 'info' | 'debug' | 'error'
  zmqEndpoint: string
  setDatadir: (dir: string) => void
  setLogsPath: (path: string) => void
  setVerbosity: (level: 'info' | 'debug' | 'error') => void
  setZmqEndpoint: (endpoint: string) => void
  exportWallet: () => Promise<void>
  importWallet: (file: File) => Promise<void>
  toggleDarkMode: () => void
}

export interface Peer {
  id: number
  address: string
  ping: number
  type: string
}

export interface MempoolTx {
  txid: string
}

export interface Block {
  hash: string
  height: number
  txs: string[]
}

export interface NetworkSlice {
  peers: Peer[]
  mempool: MempoolTx[]
  blocks: Block[]
  setPeers: (peers: Peer[]) => void
  setMempool: (txs: MempoolTx[]) => void
  setBlocks: (blocks: Block[]) => void
}

export interface AuthSlice {
  isAuthenticated: boolean
  csrfToken: string
  login: () => Promise<boolean>
  logout: () => void
}

export type AppState = NodeSlice &
  WalletSlice &
  MiningSlice &
  SettingsSlice &
  NetworkSlice &
  AuthSlice
export type AppSlice<T> = StateCreator<AppState, [], [], T>
