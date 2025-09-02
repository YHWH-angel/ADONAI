import type { AppSlice, WalletSlice } from './types'

export const createWalletSlice: AppSlice<WalletSlice> = (set) => ({
  balance: 0,
  setBalance: (balance) => set({ balance }),
})
