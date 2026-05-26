export function init(root: HTMLElement | null): void {
  if (!root) return

  const rootWithState = root as HTMLElement & {
    __randeeSwiper?: { destroy: (deleteInstance?: boolean, cleanStyles?: boolean) => void; update: () => void }
    __randeeResizeObserver?: ResizeObserver
  }

  if (rootWithState.__randeeResizeObserver) {
    rootWithState.__randeeResizeObserver.disconnect()
    rootWithState.__randeeResizeObserver = undefined
  }
  if (rootWithState.__randeeSwiper) {
    rootWithState.__randeeSwiper.destroy(true, true)
    rootWithState.__randeeSwiper = undefined
  }

  const host = root.querySelector<HTMLElement>('.randee-component-03__root')
  const slidesEl = root.querySelector<HTMLElement>('[data-role="slides"]')
  const statusEl = root.querySelector<HTMLElement>('[data-role="status"]')
  const swiperEl = root.querySelector<HTMLElement>('[data-role="swiper"]')
  if (!host || !slidesEl || !statusEl || !swiperEl) return

  const iblockFromProps = (host.dataset.cmsIblockId ?? '').trim()
  const iblockFromCmsPanel = (window.localStorage.getItem('randee-cms-selected-iblock-id') ?? '').trim()
  const iblockId = iblockFromProps || iblockFromCmsPanel
  const limit = Math.max(1, Math.min(24, Number(host.dataset.cmsLimit ?? '8') || 8))
  const autoplayMs = Math.max(1200, Number(host.dataset.cmsAutoplayMs ?? '3500') || 3500)
  const showText = (host.dataset.cmsShowText ?? 'true') === 'true'
  const imageField = (host.dataset.cmsImageField ?? 'previewPicture') === 'detailPicture' ? 'detailPicture' : 'previewPicture'

  if (!iblockId) {
    statusEl.textContent = 'Укажите Iblock ID в правой панели или выберите инфоблок на экране CMS.'
    slidesEl.innerHTML = ''
    return
  }

  const siteUrl = (window.localStorage.getItem('randee-cms-site-url') ?? '').trim().replace(/\/+$/, '')
  const apiKey = (window.localStorage.getItem('randee-cms-api-key') ?? '').trim()
  const connectorPath = (window.localStorage.getItem('randee-cms-connector-path') ?? '/local/modules/randee.connector/tools/connector.php').trim()

  if (!siteUrl || !apiKey || !connectorPath) {
    statusEl.textContent = 'Сначала настройте CMS Connection (Site URL, API key, Connector Path).'
    slidesEl.innerHTML = ''
    return
  }

  const url = new URL(connectorPath, `${siteUrl}/`)
  url.searchParams.set('action', 'elements.list')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('iblockId', iblockId)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('offset', '0')
  url.searchParams.set('format', 'json')

  void fetch(url.toString(), { method: 'GET' })
    .then((response) => response.json().then((json) => ({ ok: response.ok, json })))
    .then(({ ok, json }) => {
      if (!ok || json?.ok !== true || !Array.isArray(json?.data)) {
        statusEl.textContent = `Ошибка загрузки: ${json?.error?.message ?? 'unknown'}`
        slidesEl.innerHTML = ''
        return
      }

      const items = json.data as Array<{
        name?: string
        previewText?: string
        previewPicture?: { src?: string | null } | null
        detailPicture?: { src?: string | null } | null
      }>

      slidesEl.innerHTML = items
        .map((item) => {
          const primaryImage = imageField === 'detailPicture' ? item.detailPicture : item.previewPicture
          const fallbackImage = imageField === 'detailPicture' ? item.previewPicture : item.detailPicture
          const srcRaw = primaryImage?.src ?? fallbackImage?.src ?? ''
          const src = normalizeSrc(srcRaw, siteUrl)
          const safeTitle = escapeHtml(item.name ?? '')
          const safeText = escapeHtml(item.previewText ?? '')
          return `<div class="swiper-slide randee-component-03__slide">
            <div class="randee-component-03__media-wrap">${src ? `<img class="randee-component-03__media" src="${escapeAttr(src)}" alt="${safeTitle}" loading="lazy">` : ''}</div>
            <div class="randee-component-03__content">
              <h3 class="randee-component-03__slide-title">${safeTitle || 'Без названия'}</h3>
              ${showText && safeText ? `<p class="randee-component-03__slide-text">${safeText}</p>` : ''}
            </div>
          </div>`
        })
        .join('')

      if (items.length === 0) {
        statusEl.textContent = 'Элементы не найдены.'
        return
      }

      statusEl.textContent = `Загружено слайдов: ${items.length}`
      type SwiperInstance = { destroy: (deleteInstance?: boolean, cleanStyles?: boolean) => void; update: () => void }
      const globalWithSwiper = window as Window & { Swiper?: new (el: Element, options: unknown) => SwiperInstance }
      if (!globalWithSwiper.Swiper) {
        statusEl.textContent = 'Swiper не загружен. Добавьте vendor Swiper.'
        return
      }
      const swiper = new globalWithSwiper.Swiper(swiperEl, {
        slidesPerView: 1,
        spaceBetween: 12,
        loop: items.length > 1,
        autoplay: items.length > 1 ? { delay: autoplayMs, disableOnInteraction: false } : false,
        observer: true,
        observeParents: true,
        pagination: {
          el: root.querySelector('.swiper-pagination'),
          clickable: true
        },
        navigation: {
          nextEl: root.querySelector('.swiper-button-next'),
          prevEl: root.querySelector('.swiper-button-prev')
        }
      })

      rootWithState.__randeeSwiper = swiper

      const resizeObserver = new ResizeObserver(() => {
        swiper.update()
      })
      resizeObserver.observe(root)
      rootWithState.__randeeResizeObserver = resizeObserver
    })
    .catch((error: unknown) => {
      statusEl.textContent = `Ошибка загрузки: ${error instanceof Error ? error.message : 'unknown'}`
      slidesEl.innerHTML = ''
    })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, '&quot;')
}

function normalizeSrc(value: string, siteUrl: string): string {
  if (!value) return ''
  try {
    return new URL(value, `${siteUrl}/`).toString()
  } catch {
    return value
  }
}
