export function getTemplateAssetUrl(templateId: string, assetPath: string): string {
  const normalized = assetPath.replace(/^\/+/, '')
  return `/api/block-assets/${templateId}/${normalized}`
}
