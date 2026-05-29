import type { Viewport } from 'next'
import type { ReactNode } from 'react'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

/** Clean layout for public preview pages — no builder chrome, no warning banner */
export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ margin: 0, padding: 0 }}>
      {children}
    </div>
  )
}
