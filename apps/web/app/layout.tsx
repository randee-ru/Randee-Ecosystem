import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Golos_Text, IBM_Plex_Mono, Inter, Roboto_Serif } from 'next/font/google'
import './globals.css'
import { FloatingOrb } from '@/components/floating-orb'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600'],
})

const golosText = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-golos-text',
  display: 'swap',
  weight: ['400', '500', '700'],
})

const robotoSerif = Roboto_Serif({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-roboto-serif',
  display: 'swap',
  weight: ['400', '500', '700'],
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: 'Randee Web',
  description: 'Randee Ecosystem Builder Web App'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning className={[
      inter.variable,
      golosText.variable,
      robotoSerif.variable,
      ibmPlexMono.variable,
    ].join(' ')}>
      <body>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const key = 'randee-ui-theme'
                const saved = localStorage.getItem(key)
                const theme = saved === 'light' || saved === 'dark'
                  ? saved
                  : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                const root = document.documentElement
                root.classList.toggle('dark', theme === 'dark')
                root.style.colorScheme = theme
                root.dataset.theme = theme
              } catch (error) {}
            })()`,
          }}
        />
        <ThemeProvider>
          {children}
          <FloatingOrb />
        </ThemeProvider>
      </body>
    </html>
  )
}
