/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StateCreator } from 'zustand'

export const logger =
  <T extends object>(
    config: StateCreator<T, any, any>,
  ): StateCreator<T, any, any> =>
  (set, get, api) =>
    config(
      (partial, replace) => {
        const previous = get()
        set(partial as any, replace as any)
        console.log('[store]', { previous, next: get() })
      },
      get,
      api,
    )
