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
  toggleDarkMode: () => void
}

export type AppState = NodeSlice & WalletSlice & MiningSlice & SettingsSlice
export type AppSlice<T> = StateCreator<AppState, [], [], T>
