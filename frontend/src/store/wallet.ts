import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
