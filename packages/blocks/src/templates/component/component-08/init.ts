/**
 * React-preview init for component-08 (Hero Items Swiper).
 * The same logic lives in script.js for the standalone browser build.
 */
export function init(root: HTMLElement | null): void {
  if (!root) return
  root.classList.add('is-mounted')
  initHeroItemsSwiper(root)
}

type SwiperInstance = {
  el: HTMLElement
  params: { spaceBetween?: number }
  update: () => void
  destroy: (deleteInstance?: boolean, cleanStyles?: boolean) => void
}
type SwiperCtor = new (el: HTMLElement, options: Record<string, unknown>) => SwiperInstance
type Win = typeof window & { Swiper?: SwiperCtor; SwiperModules?: { Navigation?: unknown } }

// ── Ширина слайда ──────────────────────────────────────────────────────────────
function readSpan(slide: HTMLElement): number {
  const v = parseInt(slide.getAttribute('data-hero-items-span') ?? '1', 10)
  return Number.isFinite(v) ? Math.min(4, Math.max(1, v)) : 1
}

/**
 * Вычисляет --hero-items-slide-unit на основе реальной ширины контейнера,
 * затем просит Swiper пересчитать раскладку через swiper.update().
 */
function applyUnit(swiper: SwiperInstance, spaceBetween: number): void {
  const el = swiper.el
  const trackPx = Math.max(0, el.offsetWidth - 3)

  // Только в desktop-режиме (container >= 1000px)
  if (trackPx < 1000) {
    el.style.removeProperty('--hero-items-slide-unit')
    el.querySelectorAll<HTMLElement>('.hero-items__slide').forEach(s => { s.style.width = '' })
    requestAnimationFrame(() => swiper.update())
    return
  }

  const slides = el.querySelectorAll<HTMLElement>('.hero-items__slide')
  const n = slides.length
  if (n === 0) return

  let sumSpan = 0
  slides.forEach(s => { sumSpan += readSpan(s) })
  if (sumSpan <= 0) sumSpan = n

  let unitPx: number
  if (n > 4) {
    // Показываем окно из 4 колонок
    let gaps = 0, cols = 0, seen = 0
    slides.forEach(s => {
      if (cols >= 4) return
      const sp = readSpan(s)
      if (seen > 0 && cols + sp <= 4) gaps++
      cols += sp; seen++
    })
    unitPx = (trackPx - gaps * spaceBetween) / 4
  } else {
    unitPx = (trackPx - Math.max(0, n - 1) * spaceBetween) / sumSpan
  }

  el.style.setProperty('--hero-items-slide-unit', `${Math.round(unitPx * 100) / 100}px`)

  // Swiper должен пересчитать ширины после изменения CSS-переменной
  requestAnimationFrame(() => swiper.update())
}

// ── Инициализация Swiper ───────────────────────────────────────────────────────
function initHeroItemsSwiper(root: HTMLElement): void {
  const SwiperCtor = (window as Win).Swiper
  if (!SwiperCtor) { console.warn('[component-08] Swiper not loaded'); return }

  const el = root.querySelector<HTMLElement>('[data-hero-items-swiper]')
  if (!el) return

  const section = el.closest<HTMLElement>('.hero-items') ?? root
  const prevEl  = section.querySelector<HTMLElement>('[data-hero-items-prev]')
  const nextEl  = section.querySelector<HTMLElement>('[data-hero-items-next]')

  function createSwiper(): void {
    const existing = (el as HTMLElement & { swiper?: SwiperInstance }).swiper
    if (existing) existing.destroy(true, true)

    const nav = (window as Win).SwiperModules?.Navigation
    const gap = 20

    const sw = new SwiperCtor!(el!, {
      ...(nav ? { modules: [nav] } : {}),
      watchOverflow:   true,
      speed:           450,
      slidesPerView:   1.2,
      spaceBetween:    12,
      breakpointsBase: 'container',   // реагирует на ширину контейнера, не window
      breakpoints: {
        576:  { slidesPerView: 1.5,    spaceBetween: 14 },
        768:  { slidesPerView: 2.2,    spaceBetween: 18 },
        1000: { slidesPerView: 'auto', spaceBetween: gap, allowTouchMove: false },
      },
      navigation: prevEl && nextEl ? { prevEl, nextEl } : undefined,
      on: {
        // after init — дожидаемся полного рендера и пересчитываем
        afterInit(s: SwiperInstance) {
          requestAnimationFrame(() => applyUnit(s, gap))
        },
        breakpoint(s: SwiperInstance) {
          applyUnit(s, gap)
        },
      },
    })

    // Резерв: второй пересчёт после двух фреймов (страховка от slow-render)
    requestAnimationFrame(() => requestAnimationFrame(() => applyUnit(sw, gap)))

    // Resize
    let timer: ReturnType<typeof setTimeout>
    window.addEventListener('resize', () => {
      clearTimeout(timer)
      timer = setTimeout(() => applyUnit(sw, gap), 150)
    })

    // CMS-данные подгрузились асинхронно → новые слайды в DOM
    const wrapper = el!.querySelector('.swiper-wrapper')
    if (wrapper) {
      new MutationObserver(() => {
        // сначала calcUnit (ставит переменную), потом update (пересчитывает)
        applyUnit(sw, gap)
      }).observe(wrapper, { childList: true })
    }

    // Запускаем видео
    section.querySelectorAll<HTMLVideoElement>('.hero-items__video')
      .forEach(v => v.play().catch(() => {}))
  }

  // Ленивый init: ждём слайды если они ещё не в DOM
  const wrapper = el.querySelector('.swiper-wrapper')
  if ((wrapper?.querySelectorAll('.swiper-slide').length ?? 0) > 0) {
    createSwiper()
  } else {
    const obs = new MutationObserver(() => {
      if ((wrapper?.querySelectorAll('.swiper-slide').length ?? 0) > 0) {
        obs.disconnect()
        createSwiper()
      }
    })
    if (wrapper) obs.observe(wrapper, { childList: true })
  }
}
