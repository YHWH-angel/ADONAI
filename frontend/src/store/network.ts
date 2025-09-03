import type { AppSlice, NetworkSlice } from './types'

export const createNetworkSlice: AppSlice<NetworkSlice> = (set) => ({
  peers: [],
  mempool: [],
  blocks: [],
  setPeers: (peers) => set({ peers }),
  setMempool: (mempool) => set({ mempool }),
  setBlocks: (blocks) => set({ blocks }),
})
