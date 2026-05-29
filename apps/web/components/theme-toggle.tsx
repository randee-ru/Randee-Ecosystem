'use client'

import { MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label="Переключить тему"
      title={theme === 'dark' ? 'Темная тема' : 'Светлая тема'}
      className="relative flex h-10 w-[104px] items-center rounded-full border px-1 text-[11px] font-semibold transition"
      style={{
        borderColor: 'var(--border-subtle)',
        background: theme === 'dark'
          ? 'linear-gradient(180deg, rgb(32 34 40 / 0.98), rgb(18 19 22 / 0.98))'
          : 'linear-gradient(180deg, rgb(250 252 255), rgb(238 243 251))',
        boxShadow: theme === 'dark'
          ? 'inset 0 1px 0 rgb(255 255 255 / 0.06), 0 16px 28px rgb(0 0 0 / 0.28)'
          : 'inset 0 1px 0 rgb(255 255 255 / 0.9), 0 12px 24px rgb(15 23 42 / 0.08)',
      }}
      onClick={toggleTheme}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-1 z-0 w-[48px] rounded-full transition-all duration-200 ease-out"
        style={{
          left: theme === 'dark' ? 'calc(50% - 2px)' : '4px',
          background: theme === 'dark'
            ? 'linear-gradient(180deg, rgb(68 76 96), rgb(31 41 55))'
            : 'linear-gradient(180deg, rgb(255 255 255), rgb(226 232 240))',
          boxShadow: theme === 'dark'
            ? '0 4px 12px rgb(0 0 0 / 0.22)'
            : '0 4px 12px rgb(148 163 184 / 0.2)',
        }}
      />
      <span
        className="relative z-10 flex h-8 w-[48px] items-center justify-center rounded-full transition"
        style={{ color: theme === 'light' ? 'var(--accent)' : 'var(--text-muted)' }}
      >
        <SunMedium size={15} />
      </span>
      <span
        className="relative z-10 flex h-8 w-[48px] items-center justify-center rounded-full transition"
        style={{ color: theme === 'dark' ? '#a5c8ff' : 'var(--text-muted)' }}
      >
        <MoonStar size={15} />
      </span>
    </button>
  )
}
