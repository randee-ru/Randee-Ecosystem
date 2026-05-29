/** @param {HTMLElement | null} root */
export function init(root) {
  if (!root) return
  root.classList.add('is-mounted')
  initHeroItemsSwiper(root)
}

const DESKTOP_MIN_PX = 1000

/** @param {HTMLElement} slide */
function readSpan(slide) {
  const v = parseInt(slide.getAttribute('data-hero-items-span') ?? '1', 10)
  return Number.isFinite(v) ? Math.min(4, Math.max(1, v)) : 1
}

/**
 * Вычисляет --hero-items-slide-unit и запускает swiper.update(),
 * чтобы Swiper подхватил новые ширины слайдов.
 * @param {{ el: HTMLElement, params: { spaceBetween?: number }, update: () => void }} swiper
 * @param {number} spaceBetween
 */
function applyUnit(swiper, spaceBetween) {
  const el = swiper.el
  const trackPx = Math.max(0, (el.offsetWidth || el.getBoundingClientRect().width) - 3)

  if (trackPx < DESKTOP_MIN_PX) {
    el.style.removeProperty('--hero-items-slide-unit')
    el.querySelectorAll('.hero-items__slide').forEach(s => { s.style.width = '' })
    requestAnimationFrame(() => swiper.update())
    return
  }

  const slides = el.querySelectorAll('.hero-items__slide')
  const n = slides.length
  if (n === 0) return

  let sumSpan = 0
  slides.forEach(s => { sumSpan += readSpan(s) })
  if (sumSpan <= 0) sumSpan = n

  let unitPx
  if (n > 4) {
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

  el.style.setProperty('--hero-items-slide-unit', `${Math.floor(unitPx * 100) / 100}px`)
  requestAnimationFrame(() => swiper.update())
}

/** @param {HTMLElement} root */
function initHeroItemsSwiper(root) {
  const SwiperCtor = window.Swiper
  if (!SwiperCtor) {
    console.warn('[component-08] Swiper not loaded')
    return
  }

  const el = root.querySelector('[data-hero-items-swiper]')
  if (!(el instanceof HTMLElement)) return

  const section = el.closest('.hero-items') ?? root
  const prevEl  = section.querySelector('[data-hero-items-prev]')
  const nextEl  = section.querySelector('[data-hero-items-next]')

  function createSwiper() {
    if (el.swiper) el.swiper.destroy(true, true)

    const navigation = window.SwiperModules?.Navigation
    const spaceBetween = 20

    const swiper = new SwiperCtor(el, {
      ...(navigation ? { modules: [navigation] } : {}),
      watchOverflow:   true,
      speed:           450,
      slidesPerView:   1.2,
      spaceBetween:    12,
      breakpointsBase: 'container',
      breakpoints: {
        576:  { slidesPerView: 1.5,    spaceBetween: 14 },
        768:  { slidesPerView: 2.2,    spaceBetween: 18 },
        1000: { slidesPerView: 'auto', spaceBetween, allowTouchMove: false },
      },
      navigation: prevEl instanceof HTMLElement && nextEl instanceof HTMLElement
        ? { prevEl, nextEl } : undefined,
      on: {
        afterInit(s) { requestAnimationFrame(() => applyUnit(s, spaceBetween)) },
        breakpoint(s){ applyUnit(s, spaceBetween) },
      },
    })

    // Страховка: второй пересчёт после двух фреймов (slow-render)
    requestAnimationFrame(() => requestAnimationFrame(() => applyUnit(swiper, spaceBetween)))

    let resizeTimer
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => applyUnit(swiper, spaceBetween), 150)
    })

    const wrapper = el.querySelector('.swiper-wrapper')
    if (wrapper) {
      new MutationObserver(() => {
        applyUnit(swiper, spaceBetween)
      }).observe(wrapper, { childList: true })
    }

    section.querySelectorAll('.hero-items__video').forEach(video => {
      if (video instanceof HTMLVideoElement) video.play().catch(() => {})
    })
  }

  const wrapper = el.querySelector('.swiper-wrapper')
  const hasSlides = (wrapper?.querySelectorAll('.swiper-slide').length ?? 0) > 0

  if (hasSlides) {
    createSwiper()
  } else {
    const observer = new MutationObserver(() => {
      if ((wrapper?.querySelectorAll('.swiper-slide').length ?? 0) > 0) {
        observer.disconnect()
        createSwiper()
      }
    })
    if (wrapper) observer.observe(wrapper, { childList: true })
  }
}
