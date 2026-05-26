import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ComponentElement, ElementVariant } from '@randee/builder'
import { randeeDataRoot } from './monorepo-root'

type StoredCustomElement = {
  id: string
  name: string
  baseElementId: string
  defaultProps: Record<string, string>
  createdAt: string
}

function customElementsDir(): string {
  return join(randeeDataRoot(), 'elements')
}

function customElementPath(id: string): string {
  return join(customElementsDir(), `${id}.json`)
}

function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function sanitizeProps(props: Record<string, string>): Record<string, string> {
  const output: Record<string, string> = {}
  for (const [key, value] of Object.entries(props)) {
    if (key === '__baseElementId') continue
    output[key] = String(value ?? '')
  }
  return output
}

export function toElementVariant(item: StoredCustomElement): ElementVariant {
  return {
    id: item.id,
    name: item.name,
    group: 'Custom',
    description: `Custom reusable element (${item.baseElementId})`,
    ready: true,
    defaultProps: {
      ...item.defaultProps,
      __baseElementId: item.baseElementId
    }
  }
}

export async function listStoredCustomElements(): Promise<StoredCustomElement[]> {
  const dir = customElementsDir()
  await mkdir(dir, { recursive: true })
  const files = await readdir(dir)
  const result: StoredCustomElement[] = []
  for (const file of files) {
    if (!file.endsWith('.json')) continue
    try {
      const raw = await readFile(join(dir, file), 'utf8')
      const data = JSON.parse(raw) as StoredCustomElement
      if (!data.id?.startsWith('custom:')) continue
      result.push(data)
    } catch {
      // skip invalid files
    }
  }
  result.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  return result
}

export async function createCustomElementFromSource(
  source: Pick<ComponentElement, 'elementId' | 'name' | 'props'>,
  requestedName?: string
): Promise<StoredCustomElement> {
  const name = (requestedName?.trim() || source.name?.trim() || 'Custom Element').slice(0, 80)
  const base = source.props.__baseElementId || source.elementId
  const slug = normalizeSlug(name) || normalizeSlug(base) || 'element'
  const unique = `${slug}-${Date.now().toString(36)}`
  const id = `custom:${unique}`
  const entry: StoredCustomElement = {
    id,
    name,
    baseElementId: base,
    defaultProps: sanitizeProps(source.props),
    createdAt: new Date().toISOString()
  }
  await mkdir(customElementsDir(), { recursive: true })
  await writeFile(customElementPath(id.replace('custom:', '')), `${JSON.stringify(entry, null, 2)}\n`, 'utf8')
  return entry
}

