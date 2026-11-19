import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'taskflow-theme'

function resolveInitialMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* localStorage no disponible: usar la preferencia del sistema */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyMode(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = resolveInitialMode()
  applyMode(initial)

  return {
    mode: initial,
    setMode: (mode) => {
      try {
        localStorage.setItem(STORAGE_KEY, mode)
      } catch {
        /* noop */
      }
      applyMode(mode)
      set({ mode })
    },
    toggleMode: () => get().setMode(get().mode === 'dark' ? 'light' : 'dark'),
  }
})
