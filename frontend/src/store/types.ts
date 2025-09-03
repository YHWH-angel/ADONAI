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
  transactions: string[]
  address: string
  utxos: Utxo[]
  setBalance: (balance: number) => void
  setTransactions: (txs: string[]) => void
  setAddress: (address: string) => void
  setUtxos: (utxos: Utxo[]) => void
}

export interface Utxo {
  txid: string
  vout: number
  amount: number
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
  logs: string
  verbosity: number
  zmqEndpoint: string
  toggleDarkMode: () => void
  setDatadir: (dir: string) => void
  setLogs: (dir: string) => void
  setVerbosity: (v: number) => void
  setZmqEndpoint: (e: string) => void
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

export type AppState = NodeSlice &
  WalletSlice &
  MiningSlice &
  SettingsSlice &
  NetworkSlice
export type AppSlice<T> = StateCreator<AppState, [], [], T>
