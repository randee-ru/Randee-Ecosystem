import { chromium } from 'playwright-core'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { randeeDataRoot } from '../../../../../lib/monorepo-root'

type RouteContext = { params: Promise<{ slug: string }> }

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 минут
const THUMB_W = 1280
const THUMB_H = 900

function thumbPath(slug: string): string {
  return join(randeeDataRoot(), 'thumbnails', `${slug}.png`)
}

async function isCacheValid(slug: string): Promise<boolean> {
  try {
    const s = await stat(thumbPath(slug))
    return Date.now() - s.mtimeMs < CACHE_TTL_MS
  } catch {
    return false
  }
}

async function generateThumb(slug: string, origin: string): Promise<Buffer> {
  const execPath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    '/Users/pinomax/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'

  const browser = await chromium.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewportSize({ width: THUMB_W, height: THUMB_H })

    const url = `${origin}/preview/${encodeURIComponent(slug)}`
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15_000 })
    // Немного ждём анимации / шрифтов
    await page.waitForTimeout(600)

    const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: THUMB_W, height: THUMB_H } })

    // Кэшируем на диск
    const dir = join(randeeDataRoot(), 'thumbnails')
    await mkdir(dir, { recursive: true })
    await writeFile(thumbPath(slug), buf)

    return Buffer.from(buf)
  } finally {
    await browser.close()
  }
}

/** GET /api/builder/thumbnail/[slug]
 *  ?refresh=1 — принудительно перегенерировать
 */
export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params
  const { searchParams, origin } = new URL(request.url)
  const forceRefresh = searchParams.get('refresh') === '1'

  try {
    let buf: Buffer

    if (!forceRefresh && await isCacheValid(slug)) {
      // Отдаём закэшированный скриншот
      buf = Buffer.from(await readFile(thumbPath(slug)))
    } else {
      buf = await generateThumb(slug, origin)
    }

    return new Response(buf, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    })
  } catch (err) {
    console.error('[thumbnail]', err)
    // Вернём 1×1 прозрачный PNG как fallback
    const empty = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    )
    return new Response(empty, {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    })
  }
}
