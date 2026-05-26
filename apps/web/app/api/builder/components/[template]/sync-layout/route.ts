import { readTemplateAssetText, writeTemplateAssetText } from '@randee/blocks/template-assets'

type RouteContext = {
  params: Promise<{ template: string }>
}

type SyncElement = {
  id: string
  elementId: string
  parentId?: string | null
  props: Record<string, string>
}

type SyncBody = {
  elements?: SyncElement[]
}

function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function byParent(elements: SyncElement[]) {
  const map = new Map<string | null, SyncElement[]>()
  for (const element of elements) {
    const parentId = element.parentId ?? null
    const branch = map.get(parentId) ?? []
    branch.push(element)
    map.set(parentId, branch)
  }
  return map
}

function renderNode(
  node: SyncElement,
  children: string,
  depth: number
): string {
  const i = '  '.repeat(depth)
  const title = esc(node.props.title || node.props.label || node.elementId)
  switch (node.elementId) {
    case 'container':
      return `${i}<div className="code-sync-container" data-element-id="${node.id}">
${i}  ${children || '<div className="code-sync-empty">Container</div>'}
${i}</div>`
    case 'columns': {
      const columns = Math.max(1, Math.min(16, Number(node.props.columns ?? '2') || 2))
      const gap = Math.max(0, Math.min(120, Number(node.props.gap ?? '16') || 16))
      return `${i}<div className="code-sync-columns" style={{ display: 'grid', gridTemplateColumns: 'repeat(${columns}, minmax(0, 1fr))', gap: '${gap}px' }} data-element-id="${node.id}">
${i}  ${children || '<div className="code-sync-empty">Columns</div>'}
${i}</div>`
    }
    case 'button':
      return `${i}<button type="button" className="code-sync-button" data-element-id="${node.id}">${title}</button>`
    case 'text':
    case 'paragraph':
      return `${i}<p data-element-id="${node.id}">${title}</p>`
    case 'heading':
      return `${i}<h3 data-element-id="${node.id}">${title}</h3>`
    case 'image': {
      const src = esc(node.props.src || '')
      const alt = esc(node.props.alt || title)
      return `${i}<img src="${src}" alt="${alt}" data-element-id="${node.id}" />`
    }
    default:
      return `${i}<div className="code-sync-node" data-element-id="${node.id}">${title}${children ? `\n${i}  ${children}\n${i}` : ''}</div>`
  }
}

function renderBranch(map: Map<string | null, SyncElement[]>, parentId: string | null, depth: number): string {
  const branch = map.get(parentId) ?? []
  return branch
    .map((node) => {
      const childNodes = renderBranch(map, node.id, depth + 1)
      return renderNode(node, childNodes, depth)
    })
    .join('\n')
}

function buildGeneratedLayout(elements: SyncElement[]) {
  const map = byParent(elements)
  const markup = renderBranch(map, null, 2)
  const content = markup || `    <div className="code-sync-empty">No elements yet</div>`
  return `'use client'

export function GeneratedLayout() {
  return (
    <>
${content}
    </>
  )
}
`
}

function buildPreview(template: string) {
  const cls = template.replace(/\./g, '-')
  const comp = template
    .split(/[-.]/)
    .map((p) => `${p.charAt(0).toUpperCase()}${p.slice(1)}`)
    .join('')
  return `'use client'

import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { init } from './init'
import { GeneratedLayout } from './layout.generated'
import './style.css'

export function ${comp}Preview({ block }: BlockTemplatePreviewProps) {
  return (
    <TemplateFrame block={block} className="randee-${cls}" initScript={init}>
      <GeneratedLayout />
    </TemplateFrame>
  )
}
`
}

// встроенные шаблоны — нельзя перезаписывать через sync-layout
const BUILTIN_TEMPLATES = new Set([
  'component-03',
  'component-04',
  'hero-01', 'hero-02', 'hero-03',
  'features-01', 'features-02',
  'faq-01', 'cta-01', 'catalog-01', 'news-01'
])

export async function POST(request: Request, context: RouteContext) {
  try {
    const { template } = await context.params

    if (BUILTIN_TEMPLATES.has(template)) {
      return Response.json({ error: `Cannot sync built-in template "${template}"` }, { status: 403 })
    }

    const body = (await request.json()) as SyncBody
    const elements = Array.isArray(body.elements) ? body.elements : []
    const generated = buildGeneratedLayout(elements)

    const okLayout = writeTemplateAssetText(template, 'layout.generated.tsx', generated)
    if (!okLayout) {
      return Response.json({ error: `Component "${template}" not found` }, { status: 404 })
    }

    writeTemplateAssetText(
      template,
      'elements.snapshot.json',
      `${JSON.stringify({ version: 1, syncedAt: new Date().toISOString(), elements }, null, 2)}\n`
    )

    // Создаём init.ts если его нет (может быть нужен preview.tsx)
    const existingInit = readTemplateAssetText(template, 'init.ts')
    if (!existingInit) {
      writeTemplateAssetText(template, 'init.ts', `export function init(root: HTMLElement | null): void {\n  if (!root) return\n  root.classList.add('is-mounted')\n}\n`)
    }

    // Обновляем preview.tsx только если уже есть layout.generated (т.е. это не первый раз)
    // и только если preview.tsx не содержит GeneratedLayout (чтобы не перезаписывать кастомные)
    const existingPreview = readTemplateAssetText(template, 'preview.tsx')
    if (!existingPreview || !existingPreview.includes('GeneratedLayout')) {
      const preview = buildPreview(template)
      const okPreview = writeTemplateAssetText(template, 'preview.tsx', preview)
      if (!okPreview) {
        return Response.json({ error: `preview.tsx for "${template}" not found` }, { status: 404 })
      }
    }

    const prevStyle = readTemplateAssetText(template, 'style.css') ?? ''
    const marker = '/* code-sync generated styles */'
    if (!prevStyle.includes(marker)) {
      const patch = `
${marker}
.code-sync-container { display: flex; flex-direction: column; gap: 12px; padding: 8px; border: 1px dashed rgba(148,163,184,.5); border-radius: 10px; }
.code-sync-columns { width: 100%; }
.code-sync-button { min-height: 40px; min-width: 120px; border-radius: 10px; border: 1px solid #2563eb; background: #2563eb; color: #fff; font-weight: 600; padding: 8px 14px; }
.code-sync-empty { font-size: 12px; color: #64748b; }
.code-sync-node { padding: 6px 8px; border: 1px solid rgba(148,163,184,.4); border-radius: 8px; }
`
      writeTemplateAssetText(template, 'style.css', `${prevStyle.trimEnd()}\n${patch}`)
    }

    return Response.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync layout'
    return Response.json({ error: message }, { status: 500 })
  }
}
