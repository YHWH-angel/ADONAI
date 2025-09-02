import axios from 'axios'
import { API_BASE_URL } from './constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  // Add auth headers here if needed
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API error', error)
    return Promise.reject(error)
  },
)

export default api
