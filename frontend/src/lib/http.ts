import axios, { AxiosError } from 'axios'
import { API_BASE_URL } from '@/lib/api'

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('HTTP error:', error.message)
    return Promise.reject(error)
  },
)
