'use client'

import * as React from 'react'

export type UiTheme = 'light' | 'dark'

type ThemeContextValue = {
  theme: UiTheme
  setTheme: (theme: UiTheme) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'randee-ui-theme'

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function isTheme(value: string | null): value is UiTheme {
  return value === 'light' || value === 'dark'
}

function getSystemTheme(): UiTheme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: UiTheme): void {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<UiTheme>('dark')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const nextTheme = isTheme(saved) ? saved : getSystemTheme()
    setThemeState(nextTheme)
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [mounted, theme])

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (isTheme(saved)) return
      setThemeState(media.matches ? 'dark' : 'light')
    }

    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  const value = React.useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState((current) => (current === 'dark' ? 'light' : 'dark')),
  }), [theme])

  React.useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.dataset.theme = theme
  }, [mounted, theme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
