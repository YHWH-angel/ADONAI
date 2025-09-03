export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const API_ENDPOINTS = {
  NODE_STATUS: '/node/status',
  WALLET: '/wallet',
  TRANSACTIONS: '/txs',
} as const

export type ApiEndpoint = keyof typeof API_ENDPOINTS

export const endpoint = (key: ApiEndpoint) =>
  `${API_BASE_URL}${API_ENDPOINTS[key]}`
