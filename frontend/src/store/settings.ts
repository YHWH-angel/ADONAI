import type { AppSlice, SettingsSlice } from './types'

export const createSettingsSlice: AppSlice<SettingsSlice> = (set) => ({
  darkMode: false,
  datadir: '',
  logsPath: '',
  verbosity: 'info',
  zmqEndpoint: '',
  setDatadir: (datadir) => set({ datadir }),
  setLogsPath: (logsPath) => set({ logsPath }),
  setVerbosity: (verbosity) => set({ verbosity }),
  setZmqEndpoint: (zmqEndpoint) => set({ zmqEndpoint }),
  exportWallet: async () => {
    console.log('export wallet')
  },
  importWallet: async (file) => {
    console.log('import wallet', file)
  },
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
})
