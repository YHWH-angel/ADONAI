import type { AppSlice, SettingsSlice } from './types'

export const createSettingsSlice: AppSlice<SettingsSlice> = (set) => ({
  darkMode: false,
  datadir: '',
  logs: '',
  verbosity: 0,
  zmqEndpoint: '',
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setDatadir: (dir) => set({ datadir: dir }),
  setLogs: (dir) => set({ logs: dir }),
  setVerbosity: (v) => set({ verbosity: v }),
  setZmqEndpoint: (e) => set({ zmqEndpoint: e }),
})
