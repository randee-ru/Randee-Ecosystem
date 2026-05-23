import type { BuilderPage, PageBlock } from '../types/page'

function blockToHtml(block: PageBlock): string {
  const attrs = Object.entries(block.props)
    .map(([key, value]) => `data-${key}="${value.replace(/"/g, '&quot;')}"`)
    .join(' ')

  return `<section class="randee-block randee-${block.type.replace('.', '-')}"><div ${attrs}></div></section>`
}

export function exportPageToJson(page: BuilderPage): string {
  return JSON.stringify(page, null, 2)
}

export function exportPageToHtml(page: BuilderPage): string {
  const body = page.blocks.map(blockToHtml).join('\n')
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${page.page}</title>
</head>
<body>
${body}
</body>
</html>`
}
