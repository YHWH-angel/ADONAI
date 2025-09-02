import type { StateCreator } from 'zustand'

export interface NodeSlice {
  height: number
  setHeight: (height: number) => void
}

export interface WalletSlice {
  balance: number
  setBalance: (balance: number) => void
}

export interface MiningSlice {
  isMining: boolean
  toggleMining: () => void
}

export interface SettingsSlice {
  darkMode: boolean
  toggleDarkMode: () => void
}

export type AppState = NodeSlice & WalletSlice & MiningSlice & SettingsSlice
export type AppSlice<T> = StateCreator<AppState, [], [], T>
