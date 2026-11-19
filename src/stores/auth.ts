import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types'

interface AuthState {
  access: string | null
  refresh: string | null
  user: AuthUser | null
  setSession: (access: string, refresh: string, user: AuthUser) => void
  setTokens: (access: string, refresh: string) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      user: null,
      setSession: (access, refresh, user) => set({ access, refresh, user }),
      setTokens: (access, refresh) => set({ access, refresh }),
      clear: () => set({ access: null, refresh: null, user: null }),
    }),
    { name: 'taskflow-auth' },
  ),
)
