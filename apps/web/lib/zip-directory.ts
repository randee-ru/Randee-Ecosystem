import archiver from 'archiver'
import { createReadStream, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { PassThrough } from 'node:stream'

function appendDirectory(archive: archiver.Archiver, directory: string, archivePath: string) {
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry)
    const targetPath = archivePath ? `${archivePath}/${entry}` : entry
    const stats = statSync(fullPath)
    if (stats.isDirectory()) {
      appendDirectory(archive, fullPath, targetPath)
    } else {
      archive.append(createReadStream(fullPath), { name: targetPath })
    }
  }
}

export async function zipDirectoryToBuffer(directory: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const stream = new PassThrough()
    const chunks: Buffer[] = []

    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
    archive.on('error', reject)

    archive.pipe(stream)
    appendDirectory(archive, directory, '')
    void archive.finalize()
  })
}
