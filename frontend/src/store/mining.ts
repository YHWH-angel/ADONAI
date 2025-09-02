import type { AppSlice, MiningSlice } from './types'

export const createMiningSlice: AppSlice<MiningSlice> = (set) => ({
  isMining: false,
  toggleMining: () => set((state) => ({ isMining: !state.isMining })),
})
