import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSlice, WalletSlice } from './types'

interface WalletState {
  seed: string[]
  isLoaded: boolean
  loadWallet: (seed: string[]) => void
  clear: () => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      seed: [],
      isLoaded: false,
      loadWallet: (seed) => set({ seed, isLoaded: true }),
      clear: () => set({ seed: [], isLoaded: false }),
    }),
    {
      name: 'wallet',
      partialize: (state) => ({ seed: state.seed }),
    },
  ),
)

export const createWalletSlice: AppSlice<WalletSlice> = (set) => ({
  balance: 0,
  transactions: [],
  address: '',
  utxos: [],
  setBalance: (balance) => set({ balance }),
  setTransactions: (transactions) => set({ transactions }),
  setAddress: (address) => set({ address }),
  setUtxos: (utxos) => set({ utxos }),
})
