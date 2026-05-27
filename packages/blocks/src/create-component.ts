import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { BlockTemplateManifest } from './types'
import { isUserComponentTemplateId, USER_COMPONENT_ASSETS } from './component-template-id'
import { componentsRoot, getUserComponentDirectory, type CreatedComponentTemplate } from './component-io'

export type { CreatedComponentTemplate } from './component-io'
export { saveComponentToAssets, moveComponentToSection, listComponentTemplatesFromDisk, listSavedComponentsFromDisk, duplicateComponentTemplate, renameComponentTemplate, deleteComponentTemplate } from './component-io'

function nextComponentId(): string {
  const root = componentsRoot()
  if (!existsSync(root)) mkdirSync(root, { recursive: true })
  const existing = readdirSync(root).filter((name) => isUserComponentTemplateId(name))
  const max = existing.reduce((acc, name) => {
    const value = Number(name.replace('component-', ''))
    return Number.isFinite(value) ? Math.max(acc, value) : acc
  }, 0)
  return `component-${String(max + 1).padStart(2, '0')}`
}

function previewComponentName(templateId: string): string {
  return (
    templateId
      .split(/[-.]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Preview'
  )
}

export function createComponentTemplate(customName?: string): CreatedComponentTemplate {
  const templateId = nextComponentId()
  const number = templateId.replace('component-', '')
  const displayName = customName?.trim() || `Component ${number}`
  const cls = templateId.replace(/\./g, '-')
  const componentName = previewComponentName(templateId)
  const root = join(componentsRoot(), templateId)

  mkdirSync(join(root, 'images'), { recursive: true })

  const manifest: BlockTemplateManifest = {
    id: templateId,
    type: 'component',
    group: 'Custom',
    name: displayName,
    description: 'Empty component',
    savedToAssets: false,
    defaultProps: {
      title: displayName
    },
    propsSchema: [{ name: 'title', label: 'Title', type: 'text' }]
  }

  writeFileSync(join(root, 'meta.json'), `${JSON.stringify(manifest, null, 2)}\n`)

  writeFileSync(
    join(root, 'manifest.ts'),
    `import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: '${templateId}',
  type: 'component',
  group: 'Custom',
  name: '${displayName.replace(/'/g, "\\'")}',
  description: 'Empty component',
  savedToAssets: false,
  defaultProps: {
    title: '${displayName.replace(/'/g, "\\'")}'
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
`
  )

  writeFileSync(
    join(root, 'style.css'),
    `.randee-${cls} {
  padding: 2.5rem;
  color: #171717;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.randee-${cls}__title {
  margin: 0 0 0.5rem;
  font-size: 1.75rem;
  font-weight: 600;
}

.randee-${cls}__hint {
  margin: 0;
  font-size: 0.875rem;
  color: #737373;
}
`
  )

  writeFileSync(
    join(root, 'init.ts'),
    `export function init(root: HTMLElement | null): void {
  if (!root) return
  root.classList.add('is-mounted')
}
`
  )

  writeFileSync(
    join(root, 'script.js'),
    `/** @param {HTMLElement | null} root */
export function init(root) {
  if (!root) return
  root.classList.add('is-mounted')
}
`
  )

  writeFileSync(
    join(root, 'images', 'thumb.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
  <rect width="80" height="80" rx="12" fill="#E5E7EB"/>
  <rect x="18" y="22" width="44" height="8" rx="2" fill="#9CA3AF"/>
  <rect x="18" y="36" width="32" height="6" rx="2" fill="#D1D5DB"/>
</svg>
`
  )

  writeFileSync(
    join(root, 'layout.generated.tsx'),
    `'use client'

export function GeneratedLayout() {
  return (
    <>
      <div className="code-sync-empty">No elements yet</div>
    </>
  )
}
`
  )

  writeFileSync(
    join(root, 'elements.snapshot.json'),
    `${JSON.stringify({ version: 1, syncedAt: new Date().toISOString(), elements: [] }, null, 2)}\n`
  )

  writeFileSync(
    join(root, 'preview.tsx'),
    `'use client'

import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { init } from './init'
import { GeneratedLayout } from './layout.generated'
import './style.css'

export function ${componentName}({ block }: BlockTemplatePreviewProps) {
  return (
    <TemplateFrame block={block} className="randee-${cls}" initScript={init}>
      <GeneratedLayout />
    </TemplateFrame>
  )
}
`
  )

  return { templateId, manifest, assets: USER_COMPONENT_ASSETS }
}

export { getUserComponentDirectory }
