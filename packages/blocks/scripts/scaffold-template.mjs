#!/usr/bin/env node
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const [typeArg, idArg, nameArg] = process.argv.slice(2)

if (!typeArg || !idArg || !nameArg) {
  console.error('Usage: npm run scaffold -- <type> <template-id> <Display Name>')
  console.error('Example: npm run scaffold -- hero hero-04 "Hero Minimal"')
  process.exit(1)
}

const type = typeArg
const id = idArg
const name = nameArg
const cls = id.replace(/\./g, '-')
const componentName = id
  .split(/[-.]/)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join('') + 'Preview'

const root = join(process.cwd(), 'src', 'templates', type, id)

if (existsSync(root)) {
  console.error(`Template already exists: ${root}`)
  process.exit(1)
}

mkdirSync(join(root, 'images'), { recursive: true })

writeFileSync(
  join(root, 'manifest.ts'),
  `import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: '${id}',
  type: '${type}',
  group: '${name.split(' ')[0]}',
  name: '${name}',
  description: 'New ${name} component',
  defaultProps: {
    title: '${name}'
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
  font-size: 1.75rem;
  font-weight: 600;
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
</svg>
`
)

writeFileSync(
  join(root, 'preview.tsx'),
  `'use client'

import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { init } from './init'
import { getTemplateAssetUrl } from '../../../utils/asset-url'
import './style.css'

export function ${componentName}({ block }: BlockTemplatePreviewProps) {
  const title = block.props.title ?? '${name}'

  return (
    <TemplateFrame block={block} className="randee-${cls}" initScript={init}>
      <img
        src={getTemplateAssetUrl(block.template, 'images/thumb.svg')}
        alt=""
        aria-hidden="true"
        width={80}
        height={80}
      />
      <h2 className="randee-${cls}__title">{title}</h2>
    </TemplateFrame>
  )
}
`
)

console.log(`Created template at ${root}`)
console.log('Next: register it in src/registry.ts')
