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
  setBalance: (balance: number) => void
  setTransactions: (txs: string[]) => void
}

export interface MiningSlice {
  isMining: boolean
  minerHashrate: number
  toggleMining: () => void
  setIsMining: (isMining: boolean) => void
  setMinerHashrate: (hashrate: number) => void
}

export interface SettingsSlice {
  darkMode: boolean
  toggleDarkMode: () => void
}

export type AppState = NodeSlice & WalletSlice & MiningSlice & SettingsSlice
export type AppSlice<T> = StateCreator<AppState, [], [], T>
