import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import type { ApiErrorBody, Paginated } from '@/types'

export const API_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshPromise: Promise<string> | null = null

api.interceptors.request.use((config) => {
  const access = useAuthStore.getState().access
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status

    if (!original || status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    const url = original.url ?? ''
    // El login, el registro y el refresh no deben intentar refrescarse.
    if (
      url.includes('/auth/login/') ||
      url.includes('/auth/register/') ||
      url.includes('/auth/refresh/')
    ) {
      return Promise.reject(error)
    }

    const refreshToken = useAuthStore.getState().refresh
    if (!refreshToken) {
      useAuthStore.getState().clear()
      return Promise.reject(error)
    }

    original._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post<{ access: string; refresh: string }>(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          })
          .then(({ data }) => {
            useAuthStore.getState().setTokens(data.access, data.refresh)
            return data.access
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      const access = await refreshPromise
      original.headers = original.headers ?? {}
      original.headers.Authorization = `Bearer ${access}`
      return api(original)
    } catch (refreshError) {
      useAuthStore.getState().clear()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
      return Promise.reject(refreshError)
    }
  },
)

const STATUS_MESSAGES: Record<number, string> = {
  400: 'La solicitud no es válida.',
  401: 'Tu sesión ha expirado. Inicia sesión de nuevo.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  405: 'Método no permitido.',
  409: 'Hay un conflicto con los datos enviados.',
  429: 'Demasiadas solicitudes. Espera un momento.',
  500: 'Ocurrió un error en el servidor. Inténtalo más tarde.',
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.'
    }

    const data = error.response.data
    if (data && typeof data === 'object' && 'message' in data && data.message) {
      return data.message
    }

    return STATUS_MESSAGES[error.response.status] ?? 'Ocurrió un error inesperado.'
  }

  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}

export function getApiFieldErrors(error: unknown): Record<string, string[]> {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.errors ?? {}
  }
  return {}
}

export async function fetchAll<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<T[]> {
  const results: T[] = []
  let page = 1

  while (page <= 50) {
    const { data } = await api.get<Paginated<T>>(url, {
      params: { ...params, page, page_size: 100 },
    })

    results.push(...data.results)

    if (!data.next || data.results.length === 0) break
    page += 1
  }

  return results
}
