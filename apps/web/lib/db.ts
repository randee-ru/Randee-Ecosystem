import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@prisma/client'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { randeeDataRoot } from './monorepo-root'

function createClient(): PrismaClient {
  const dbDir = randeeDataRoot()
  mkdirSync(dbDir, { recursive: true })
  const url = join(dbDir, 'randee.db')
  const adapter = new PrismaBetterSqlite3({ url })
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
