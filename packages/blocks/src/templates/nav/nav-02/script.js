const OVERLAY_SEL = '[data-menu-overlay]'
const TRIGGER_SEL = '[data-menu-overlay-trigger]'
const CLOSE_SEL   = '[data-menu-overlay-close]'

/** @param {HTMLElement | null} _root */
export function init(_root) {
  const overlay = document.querySelector(OVERLAY_SEL)
  if (!overlay) return

  // ── Режим редактора ──────────────────────────────────────────────────────
  const isEditorMode = window.location.pathname.startsWith('/builder')

  if (isEditorMode && _root) {
    _root.setAttribute('data-editor-mode', '')
    const shell = overlay.querySelector('.menu-overlay__shell')
    if (shell) {
      shell.style.transition = 'none'
      shell.style.transform  = 'none'
    }
    overlay.classList.add('is-open')
    overlay.setAttribute('aria-hidden', 'false')
    return
  }

  // ── Production ───────────────────────────────────────────────────────────
  const isOpen = () => overlay.classList.contains('is-open')

  let savedScrollY = 0

  const lockScroll = () => {
    savedScrollY = window.scrollY
    document.body.style.overflow  = 'hidden'
    document.body.style.position  = 'fixed'
    document.body.style.top       = `-${savedScrollY}px`
    document.body.style.width     = '100%'
  }

  const unlockScroll = () => {
    document.body.style.overflow  = ''
    document.body.style.position  = ''
    document.body.style.top       = ''
    document.body.style.width     = ''
    window.scrollTo(0, savedScrollY)
  }

  const open = () => {
    if (isOpen()) return
    overlay.classList.add('is-open')
    overlay.setAttribute('aria-hidden', 'false')
    document.querySelectorAll(TRIGGER_SEL)
      .forEach(t => t.setAttribute('aria-expanded', 'true'))
    document.documentElement.classList.add('menu-overlay-is-open')
    lockScroll()
    const closeBtn = overlay.querySelector('[data-focus]')
    if (closeBtn) closeBtn.focus()
  }

  const close = () => {
    if (!isOpen()) return
    overlay.classList.remove('is-open')
    overlay.setAttribute('aria-hidden', 'true')
    document.querySelectorAll(TRIGGER_SEL)
      .forEach(t => t.setAttribute('aria-expanded', 'false'))
    document.documentElement.classList.remove('menu-overlay-is-open')
    unlockScroll()
    const firstTrigger = document.querySelector(TRIGGER_SEL)
    if (firstTrigger) firstTrigger.focus()
  }

  // ── Делегирование на document — работает независимо от порядка загрузки ──
  document.addEventListener('click', (e) => {
    const target = e.target

    if (target.closest(TRIGGER_SEL)) {
      isOpen() ? close() : open()
      return
    }

    if (target.closest(CLOSE_SEL)) {
      close()
    }
  })

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Escape' || e.key === 'Esc') && isOpen()) close()
  })
}
