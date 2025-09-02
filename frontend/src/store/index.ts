import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createNodeSlice } from './node'
import { createWalletSlice } from './wallet'
import { createMiningSlice } from './mining'
import { createSettingsSlice } from './settings'
import { logger } from './middleware/logger'
import type { AppState } from './types'

export const useAppStore = create<AppState>()(
  logger(
    devtools(
      persist(
        (set, get, api) => ({
          ...createNodeSlice(set, get, api),
          ...createWalletSlice(set, get, api),
          ...createMiningSlice(set, get, api),
          ...createSettingsSlice(set, get, api),
        }),
        { name: 'app-state' },
      ),
    ),
  ),
)
