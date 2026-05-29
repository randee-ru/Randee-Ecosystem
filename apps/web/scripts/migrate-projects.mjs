/**
 * Миграция: создаёт пользователя admin и переносит projects.json в SQLite.
 * Запуск: node apps/web/scripts/migrate-projects.mjs
 */

import { createRequire } from 'module'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { scryptSync, randomBytes } from 'crypto'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Пути ──────────────────────────────────────────────────────────────────────
const monorepoRoot = join(__dirname, '..', '..', '..')
const dataRoot = join(monorepoRoot, '.randee')
const dbPath = join(dataRoot, 'randee.db')
const projectsJson = join(dataRoot, 'projects.json')

// ── Хеш пароля (тот же алгоритм что в auth.ts) ────────────────────────────────
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64)
  return `${salt}:${derived.toString('hex')}`
}

// ── Запуск ────────────────────────────────────────────────────────────────────

const Database = require('better-sqlite3')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

console.log('📂 БД:', dbPath)

// 1. Создать или найти admin
const ADMIN_EMAIL = 'admin@randee.local'
const ADMIN_NAME  = 'Admin'
const ADMIN_PASS  = '121351'

let admin = db.prepare('SELECT * FROM User WHERE email = ?').get(ADMIN_EMAIL)

if (admin) {
  console.log('✅ Пользователь admin уже существует, id:', admin.id)
} else {
  const { v4: uuidv4 } = require('uuid')
  const id = uuidv4 ? uuidv4() : crypto.randomUUID()
  const passwordHash = hashPassword(ADMIN_PASS)
  db.prepare(
    'INSERT INTO User (id, email, name, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?)'
  ).run(id, ADMIN_EMAIL, ADMIN_NAME, passwordHash, new Date().toISOString())
  admin = db.prepare('SELECT * FROM User WHERE email = ?').get(ADMIN_EMAIL)
  console.log('✅ Создан пользователь admin, id:', admin.id)
}

// 2. Перенести проекты из projects.json
if (!existsSync(projectsJson)) {
  console.log('⚠️  projects.json не найден, пропускаем')
  process.exit(0)
}

const rawProjects = JSON.parse(readFileSync(projectsJson, 'utf8'))
console.log(`\n📋 Найдено проектов в JSON: ${rawProjects.length}`)

let created = 0
let skipped = 0

for (const p of rawProjects) {
  const existing = db.prepare('SELECT id FROM Project WHERE slug = ?').get(p.slug)
  if (existing) {
    console.log(`  ⏩ Пропущен (уже есть): ${p.name} (${p.slug})`)
    skipped++
    continue
  }

  // Генерируем новый cuid-подобный id
  const newId = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

  db.prepare(
    `INSERT INTO Project (id, slug, name, url, type, userId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newId,
    p.slug,
    p.name,
    p.url || null,
    'site',
    admin.id,
    p.createdAt || new Date().toISOString(),
    p.updatedAt || new Date().toISOString(),
  )
  console.log(`  ✅ Перенесён: ${p.name} (${p.slug})`)
  created++
}

console.log(`\n🎉 Готово: создано ${created}, пропущено ${skipped}`)
console.log(`\n🔑 Логин admin:`)
console.log(`   Email:    ${ADMIN_EMAIL}`)
console.log(`   Пароль:   ${ADMIN_PASS}`)
db.close()
