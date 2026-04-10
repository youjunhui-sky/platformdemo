import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { storage } from '@/utils/storage'
import type { ApiResponse } from '@/types'
import router from '@/router'

const BASE_URL = '/api/v1'

// Create axios instance
const service: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Flag to prevent multiple token refresh attempts
let isRefreshing = false
let requestQueue: Array<(token: string) => void> = []

// Process queued requests after token refresh
const processQueue = (token: string) => {
  requestQueue.forEach((cb) => cb(token))
  requestQueue = []
}

// Request interceptor
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    if (res.code === undefined) {
      return response
    }

    if (res.code !== 0) {
      ElMessage.error(res.message || 'Request failed')

      // Token expired
      if (res.code === 401) {
        handleUnauthorized()
      }

      return Promise.reject(new Error(res.message || 'Request failed'))
    }

    return response
  },
  async (error) => {
    const status = error.response?.status
    const res = error.response?.data

    if (status === 401) {
      // Token expired, try to refresh
      const refreshed = await handleUnauthorized()
      if (refreshed) {
        // Retry original request
        const config = error.config
        if (config) {
          const token = storage.getToken()
          config.headers.Authorization = `Bearer ${token}`
          return service(config)
        }
      }
    } else if (status === 403) {
      ElMessage.error('No permission to access this resource')
      router.push('/403')
    } else if (status === 500) {
      ElMessage.error('Server error, please try again later')
    } else if (res?.message) {
      ElMessage.error(res.message)
    } else {
      ElMessage.error('Request failed, please try again')
    }

    return Promise.reject(error)
  }
)

// Handle 401 unauthorized
const handleUnauthorized = async (): Promise<boolean> => {
  // If already refreshing, wait for it
  if (isRefreshing) {
    return new Promise((resolve) => {
      requestQueue.push((token: string) => {
        resolve(true)
      })
    })
  }

  isRefreshing = true

  try {
    const refreshToken = storage.getRefreshToken()
    if (!refreshToken) {
      redirectToLogin()
      return false
    }

    // Call refresh token API
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken
    })

    const { accessToken, expiresIn } = response.data.data || {}

    if (accessToken) {
      storage.setToken(accessToken)
      // Update expiration time tracking
      localStorage.setItem('hospital_token_expires', String(Date.now() + expiresIn * 1000))

      const userStore = useUserStore()
      userStore.setToken(accessToken)

      processQueue(accessToken)
      isRefreshing = false
      return true
    } else {
      redirectToLogin()
      return false
    }
  } catch (error) {
    redirectToLogin()
    return false
  } finally {
    isRefreshing = false
  }
}

// Redirect to login page
const redirectToLogin = () => {
  storage.clearAll()

  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  userStore.reset()
  permissionStore.reset()

  router.push('/login')
}

// Export request method
export const request = {
  get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.get(url, { params, ...config })
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.post(url, data, config)
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.put(url, data, config)
  },

  delete<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.delete(url, { params, ...config })
  },

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.patch(url, data, config)
  }
}

export default service
