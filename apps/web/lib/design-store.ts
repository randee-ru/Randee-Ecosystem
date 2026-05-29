import { db } from './db'

export type DesignFile = {
  id: string
  name: string
  projectId: string
  data: string
  createdAt: string
  updatedAt: string
}

function toDesignFile(row: {
  id: string
  name: string
  projectId: string
  data: string
  createdAt: Date
  updatedAt: Date
}): DesignFile {
  return {
    id: row.id,
    name: row.name,
    projectId: row.projectId,
    data: row.data,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listDesignFiles(projectId: string): Promise<DesignFile[]> {
  const rows = await db.designFile.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
  })
  return rows.map(toDesignFile)
}

export async function createDesignFile(data: { name: string; projectId: string }): Promise<DesignFile> {
  const row = await db.designFile.create({
    data: { name: data.name, projectId: data.projectId },
  })
  return toDesignFile(row)
}

export async function getDesignFile(id: string): Promise<DesignFile | null> {
  const row = await db.designFile.findUnique({ where: { id } })
  return row ? toDesignFile(row) : null
}

export async function saveDesignFile(id: string, data: string): Promise<DesignFile | null> {
  try {
    const row = await db.designFile.update({ where: { id }, data: { data } })
    return toDesignFile(row)
  } catch { return null }
}

export async function renameDesignFile(id: string, name: string): Promise<DesignFile | null> {
  try {
    const row = await db.designFile.update({ where: { id }, data: { name } })
    return toDesignFile(row)
  } catch { return null }
}

export async function deleteDesignFile(id: string): Promise<void> {
  await db.designFile.delete({ where: { id } }).catch(() => null)
}
