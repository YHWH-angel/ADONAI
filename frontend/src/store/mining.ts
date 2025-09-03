import type { AppSlice, MiningSlice } from './types'

export const createMiningSlice: AppSlice<MiningSlice> = (set) => ({
  isMining: false,
  minerHashrate: 0,
  toggleMining: () => set((state) => ({ isMining: !state.isMining })),
  setIsMining: (isMining) => set({ isMining }),
  setMinerHashrate: (minerHashrate) => set({ minerHashrate }),
})
