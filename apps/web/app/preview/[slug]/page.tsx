import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { readStoredPage } from '../../../lib/pages-store'
import type { BuilderPage } from '@randee/builder'
import { PreviewClient } from './preview-client'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await readStoredPage(slug) as BuilderPage | null
  if (!page) return { title: 'Страница не найдена' }

  const seo = page.seo
  return {
    title: seo?.title || page.page || slug,
    description: seo?.description || undefined,
    openGraph: seo?.ogImage ? { images: [seo.ogImage] } : undefined,
    robots: seo?.noindex ? { index: false, follow: false } : undefined,
  }
}

export default async function PreviewPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sp = await searchParams
  const page = await readStoredPage(slug) as BuilderPage | null

  if (!page) notFound()

  const slugKey = slug.replace(/^\//, '') || 'home'
  const vpParam = typeof sp.vp === 'string' ? sp.vp : undefined
  const viewport = (vpParam === 'tablet' || vpParam === 'mobile' || vpParam === 'macbook') ? vpParam : 'desktop'

  return (
    <>
      <PreviewClient page={page} viewport={viewport} />

      {/* "Edit in builder" badge — bottom right corner */}
      <a
        href={`/builder?slug=${encodeURIComponent(slugKey)}`}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: 'rgba(17,17,17,0.88)',
          color: '#e8e8e8',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'system-ui, sans-serif',
          borderRadius: 8,
          textDecoration: 'none',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Редактировать
      </a>
    </>
  )
}
