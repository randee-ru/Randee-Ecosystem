import type { Viewport } from 'next'
import type { ReactNode } from 'react'

/**
 * Builder-specific layout.
 * Overrides the global viewport to prevent iOS Safari from zooming
 * the builder UI (which breaks touch coordinate mapping).
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Do NOT set maximumScale / userScalable — iOS 16+ ignores them and
  // the mismatch confuses coordinate hit-testing. CSS touch-action handles zoom lock.
}

export default function BuilderLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        html, body {
          /* Prevent pinch-zoom and double-tap-zoom on the whole builder page.
             The canvas overrides this locally with its own touch-action. */
          touch-action: pan-x pan-y;
          -webkit-text-size-adjust: 100%;
          overscroll-behavior: none;
        }

        /* Desktop-only warning banner */
        .builder-desktop-warning {
          display: none;
        }
        @media (max-width: 1024px) {
          .builder-desktop-warning {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 9999;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: rgba(18, 18, 22, 0.95);
            border-top: 1px solid rgba(255,255,255,0.10);
            color: rgba(255,255,255,0.72);
            font-size: 12px;
            font-family: system-ui, sans-serif;
            backdrop-filter: blur(8px);
          }
          .builder-desktop-warning svg {
            flex-shrink: 0;
            opacity: 0.7;
          }
        }
      `}</style>

      {children}

      {/* Warning shown only on tablet/mobile (≤1024px) */}
      <div className="builder-desktop-warning">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        <span>
          Билдер оптимизирован для&nbsp;десктопа. На планшете может работать нестабильно —
          для&nbsp;лучшего опыта откройте на&nbsp;компьютере.
        </span>
      </div>
    </>
  )
}
