'use client'

import * as React from 'react'
import { BlockPreview, BlockVendorProvider } from '@randee/blocks'
import type { BuilderPage } from '@randee/builder'

type Props = { page: BuilderPage; viewport?: string }

export function PreviewClient({ page, viewport = 'desktop' }: Props) {
  // Notify parent builder about content height (for iframe secondary viewports)
  React.useEffect(() => {
    const notify = () => {
      const h = document.documentElement.scrollHeight || document.body.scrollHeight
      if (window.parent !== window && h > 0) {
        window.parent.postMessage({ type: 'randee-frame-height', height: h }, '*')
      }
    }
    // Notify after initial render and after fonts/images load
    notify()
    window.addEventListener('load', notify)
    const timer = window.setTimeout(notify, 800)
    return () => {
      window.removeEventListener('load', notify)
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <BlockVendorProvider page={page}>
      <div style={{ minHeight: '100vh' }}>
        {page.blocks.map((block) => (
          <div
            key={block.id}
            style={{
              background: block.design?.fill
                ? `#${block.design.fill}`
                : undefined
            }}
          >
          <BlockPreview
            block={block}
            elementOptions={{ viewport: viewport as 'desktop' | 'tablet' | 'mobile' | 'macbook' }}
          />
          </div>
        ))}
        {page.blocks.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 12,
            color: '#888',
            fontFamily: 'system-ui, sans-serif',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <p style={{ margin: 0, fontSize: 14 }}>Страница пустая</p>
          </div>
        )}
      </div>
    </BlockVendorProvider>
  )
}
