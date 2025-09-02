import type { AppSlice, NodeSlice } from './types'

export const createNodeSlice: AppSlice<NodeSlice> = (set) => ({
  height: 0,
  setHeight: (height) => set({ height }),
})
