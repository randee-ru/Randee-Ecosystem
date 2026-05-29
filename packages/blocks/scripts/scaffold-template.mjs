#!/usr/bin/env node
/**
 * Scaffold нового блока + автоматическая регистрация в registry.ts
 *
 * Использование:
 *   pnpm scaffold <type> <id> "Название"
 *
 * Примеры:
 *   pnpm scaffold component component-10 "Баннер"
 *   pnpm scaffold hero hero-04 "Hero Minimal"
 *   pnpm scaffold section section-01 "О компании"
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

// ─── Аргументы ───────────────────────────────────────────────────────────────

const [typeArg, idArg, ...nameParts] = process.argv.slice(2)
const nameArg = nameParts.join(' ')

if (!typeArg || !idArg || !nameArg) {
  console.error('Использование: pnpm scaffold <type> <id> "Название"')
  console.error('Пример:        pnpm scaffold component component-10 "Баннер"')
  process.exit(1)
}

const type = typeArg
const id   = idArg
const name = nameArg
const cls  = id.replace(/[^a-z0-9]/gi, '-')

// ComponentId → ComponentIdPreview (camelCase)
const PascalId = id
  .split(/[-_.]/)
  .map(p => p.charAt(0).toUpperCase() + p.slice(1))
  .join('')

const PreviewComponent  = `${PascalId}Preview`
const LayoutComponent   = `${PascalId}Layout`
const varPrefix         = PascalId.charAt(0).toLowerCase() + PascalId.slice(1)
const manifestVar       = `${varPrefix}Manifest`
const assetsVar         = `${varPrefix}Assets`

const root = resolve(process.cwd(), 'src', 'templates', type, id)

if (existsSync(root)) {
  console.error(`❌  Блок уже существует: ${root}`)
  process.exit(1)
}

// ─── Создаём файлы ───────────────────────────────────────────────────────────

mkdirSync(join(root, 'images'), { recursive: true })

// manifest.ts
writeFileSync(join(root, 'manifest.ts'), `\
import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: '${id}',
  type: '${type}',
  group: 'Custom',
  name: '${name}',
  description: '${name}',
  savedToAssets: true,
  defaultProps: {
    title: '${name}',
  },
  propsSchema: [
    { name: 'title', label: 'Заголовок', type: 'text' },
  ],
  // dependencies: ['gsap'], // раскомментируй если нужен GSAP / Swiper
}

export const assets = {
  stylePath:  'style.css',
  scriptPath: 'script.js',
  images:     ['images/thumb.svg'],
} as const
`)

// layout.generated.tsx  — чистый HTML без TemplateFrame (используется в edit-mode)
writeFileSync(join(root, 'layout.generated.tsx'), `\
'use client'

export type ${PascalId}Props = {
  title?: string
}

export function ${LayoutComponent}({
  title = '${name}',
}: ${PascalId}Props) {
  return (
    <section className="${cls}">
      <div className="${cls}__container">
        <h2 className="${cls}__title">{title}</h2>
      </div>
    </section>
  )
}
`)

// preview.tsx  — оборачивает GeneratedLayout в TemplateFrame
writeFileSync(join(root, 'preview.tsx'), `\
'use client'

import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { init } from './init'
import { ${LayoutComponent} } from './layout.generated'
import './style.css'

export function ${PreviewComponent}({ block }: BlockTemplatePreviewProps) {
  const p = block.props as Record<string, string>

  return (
    <TemplateFrame block={block} className="randee-${cls}" initScript={init}>
      <${LayoutComponent}
        title={p.title}
      />
    </TemplateFrame>
  )
}
`)

// style.css
writeFileSync(join(root, 'style.css'), `\
/* ─── ${name} ─────────────────────────────────── */

.randee-${cls} {
  /* стили блока */
}

.${cls} {
  padding: 4rem 2rem;
}

.${cls}__container {
  max-width: 1296px;
  margin: 0 auto;
}

.${cls}__title {
  font-size: 2rem;
  font-weight: 700;
  color: #0d1010;
}
`)

// init.ts  — TS-версия (билдер / dev)
writeFileSync(join(root, 'init.ts'), `\
export function init(root: HTMLElement | null): void {
  if (!root) return
  root.classList.add('is-mounted')

  // TODO: добавить интерактивность
}
`)

// script.js  — JS-версия (продакшн, загружается в браузер)
writeFileSync(join(root, 'script.js'), `\
/** @param {HTMLElement | null} root */
export function init(root) {
  if (!root) return
  root.classList.add('is-mounted')

  // TODO: добавить интерактивность
}
`)

// thumb.svg
writeFileSync(join(root, 'images', 'thumb.svg'), `\
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="none">
  <rect width="80" height="80" rx="12" fill="#E5E7EB"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="sans-serif" font-size="11" fill="#6B7280">${name}</text>
</svg>
`)

console.log(`\n✅  Блок создан: src/templates/${type}/${id}/\n`)
console.log(`   manifest.ts          — описание и схема пропсов`)
console.log(`   layout.generated.tsx — чистый HTML компонент`)
console.log(`   preview.tsx          — обёртка для билдера`)
console.log(`   style.css            — стили (скоупинг: .${cls})`)
console.log(`   init.ts / script.js  — JS-логика`)

// ─── Авторегистрация в registry.ts ───────────────────────────────────────────

const registryPath = resolve(process.cwd(), 'src', 'registry.ts')

if (!existsSync(registryPath)) {
  console.warn('\n⚠️  src/registry.ts не найден — зарегистрируй блок вручную.')
  process.exit(0)
}

let reg = readFileSync(registryPath, 'utf8')

if (!reg.includes('// scaffold:imports') || !reg.includes('// scaffold:entries')) {
  console.warn('\n⚠️  Маркеры // scaffold:imports / // scaffold:entries не найдены в registry.ts.')
  console.warn('   Добавь блок вручную или расставь маркеры.')
  process.exit(0)
}

// 1. Вставляем два import-а перед маркером // scaffold:imports
const importBlock =
  `import { manifest as ${manifestVar}, assets as ${assetsVar} } from './templates/${type}/${id}/manifest'\n` +
  `import { ${PreviewComponent} } from './templates/${type}/${id}/preview'\n` +
  `// scaffold:imports`

reg = reg.replace('// scaffold:imports', importBlock)

// 2. Вставляем строку реестра перед маркером // scaffold:entries
const entryLine =
  `  '${id}': { manifest: ${manifestVar}, assets: ${assetsVar}, Preview: ${PreviewComponent} },\n` +
  `  // scaffold:entries`

reg = reg.replace('  // scaffold:entries', entryLine)

writeFileSync(registryPath, reg)
console.log(`\n📋  Зарегистрирован в src/registry.ts автоматически.`)
console.log(`    '${id}' → ${PreviewComponent}\n`)
