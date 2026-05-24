'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'

type UiTheme = 'light' | 'dark'

type ThemeToggleTokens = {
  segmentTrack: string
  segmentActive: string
  segmentShadow: string
  text: string
  textMuted: string
  accent: string
  divider: string
}

export function BuilderThemeToggle({
  theme,
  onThemeChange,
  t
}: {
  theme: UiTheme
  onThemeChange: (theme: UiTheme) => void
  t: ThemeToggleTokens
}) {
  return (
    <div
      role="group"
      aria-label="Color theme"
      className="flex h-8 items-center rounded-lg p-0.5"
      style={{
        background: t.segmentTrack,
        boxShadow: t.segmentShadow,
        border: `1px solid ${t.divider}`
      }}
    >
      <button
        type="button"
        aria-label="Light theme"
        aria-pressed={theme === 'light'}
        title="Light theme"
        className="flex h-7 w-8 items-center justify-center rounded-md transition"
        style={{
          background: theme === 'light' ? t.segmentActive : 'transparent',
          color: theme === 'light' ? t.accent : t.textMuted,
          border: 'none',
          cursor: 'pointer',
          boxShadow: theme === 'light' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
        }}
        onClick={() => onThemeChange('light')}
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="Dark theme"
        aria-pressed={theme === 'dark'}
        title="Dark theme"
        className="flex h-7 w-8 items-center justify-center rounded-md transition"
        style={{
          background: theme === 'dark' ? t.segmentActive : 'transparent',
          color: theme === 'dark' ? t.accent : t.textMuted,
          border: 'none',
          cursor: 'pointer',
          boxShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
        }}
        onClick={() => onThemeChange('dark')}
      >
        <Moon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
