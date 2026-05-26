/** vscode:// and cursor:// deep links for local template files */
export function buildIdeFileUri(absolutePath: string, line = 1, column = 1, ide: 'vscode' | 'cursor' = 'vscode'): string {
  const posix = absolutePath.replace(/\\/g, '/')
  const pathPart = posix.startsWith('/') ? posix : `/${posix}`
  return `${ide}://file${pathPart}:${line}:${column}`
}

export async function openTemplateAssetInIde(
  templateId: string,
  relativePath: string,
  options?: { line?: number; column?: number; ide?: 'vscode' | 'cursor' }
): Promise<void> {
  const file = relativePath.replace(/^\/+/, '')
  const response = await fetch(
    `/api/builder/components/${encodeURIComponent(templateId)}/asset-path?file=${encodeURIComponent(file)}`
  )
  const payload = (await response.json().catch(() => ({}))) as {
    absolutePath?: string
    error?: string
  }
  if (!response.ok || !payload.absolutePath) {
    throw new Error(payload.error ?? 'Не удалось получить путь к файлу')
  }

  const ide = options?.ide ?? 'vscode'
  const uri = buildIdeFileUri(payload.absolutePath, options?.line ?? 1, options?.column ?? 1, ide)
  window.location.href = uri
}
