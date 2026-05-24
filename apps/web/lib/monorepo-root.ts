import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export function monorepoRoot(): string {
  let dir = process.cwd()
  for (let depth = 0; depth < 6; depth += 1) {
    const pkgPath = join(dir, 'package.json')
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string }
        if (pkg.name === 'randee-ecosystem') return dir
      } catch {
        // continue walking up
      }
    }
    const parent = join(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  return process.cwd()
}

export function randeeDataRoot(): string {
  return join(monorepoRoot(), '.randee')
}
