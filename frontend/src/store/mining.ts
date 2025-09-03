import type { AppSlice, MiningSlice } from './types'

export const createMiningSlice: AppSlice<MiningSlice> = (set) => ({
  isMining: false,
  minerHashrate: 0,
  mode: 'solo',
  setIsMining: (isMining) => set({ isMining }),
  setMinerHashrate: (minerHashrate) => set({ minerHashrate }),
  setMode: (mode) => set({ mode }),
})
