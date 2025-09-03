import type { AppSlice, NodeSlice } from './types'

export const createNodeSlice: AppSlice<NodeSlice> = (set) => ({
  height: 0,
  difficulty: 0,
  netHashrate: 0,
  setHeight: (height) => set({ height }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setNetHashrate: (netHashrate) => set({ netHashrate }),
})
