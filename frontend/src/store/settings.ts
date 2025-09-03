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
    try {
      const res = await fetch('/api/exportwallet')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'wallet.dat'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('export wallet failed', err)
    }
  },
  importWallet: async (file) => {
    try {
      const content = await file.text()
      await fetch('/api/importwallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
    } catch (err) {
      console.error('import wallet failed', err)
    }
  },
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
})
