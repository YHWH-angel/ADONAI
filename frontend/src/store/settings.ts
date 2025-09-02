import type { AppSlice, SettingsSlice } from './types'

export const createSettingsSlice: AppSlice<SettingsSlice> = (set) => ({
  darkMode: false,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
})
