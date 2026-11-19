import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import type { AuthUser, LoginResponse } from '@/types'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  confirm_password: string
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await api.post<LoginResponse>('/auth/login/', payload)
      return data
    },
    onSuccess: (data) => {
      // Evita mostrar datos en caché de una sesión anterior.
      queryClient.clear()
      setSession(data.access, data.refresh, data.user)
    },
  })
}

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      await api.post('/auth/register/', payload)
      const { data } = await api.post<LoginResponse>('/auth/login/', {
        email: payload.email,
        password: payload.password,
      })
      return data
    },
    onSuccess: (data) => {
      queryClient.clear()
      setSession(data.access, data.refresh, data.user)
    },
  })
}

export interface PasswordResetPayload {
  email: string
}

export interface PasswordResetConfirmPayload {
  uidb64: string
  token: string
  new_password: string
  confirm_password: string
}

export function usePasswordReset() {
  return useMutation({
    mutationFn: async (payload: PasswordResetPayload) => {
      const { data } = await api.post<{ message: string }>('/auth/password-reset/', payload)
      return data
    },
  })
}

export function usePasswordResetConfirm() {
  return useMutation({
    mutationFn: async (payload: PasswordResetConfirmPayload) => {
      const { data } = await api.post<{ message: string }>(
        '/auth/password-reset/confirm/',
        payload,
      )
      return data
    },
  })
}

export function useLogout() {
  const clear = useAuthStore((state) => state.clear)

  return useMutation({
    mutationFn: async () => {
      const refresh = useAuthStore.getState().refresh
      if (!refresh) return
      try {
        await api.post('/auth/logout/', { refresh })
      } catch {
        // Aunque el refresh ya no sea válido, cerramos la sesión local.
      }
    },
    onSettled: () => {
      clear()
    },
  })
}

export function useCurrentUser(): AuthUser | null {
  return useAuthStore((state) => state.user)
}
