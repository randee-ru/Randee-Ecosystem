const THEME_KEY = 'randee-header-theme'

/** @param {HTMLElement | null} root */
export function init(root) {
  if (!root) return
  root.classList.add('is-mounted')

  const header = root.querySelector('.header')
  if (!header) return

  // ── Scroll → is-scrolled ─────────────────────────────────────────────────
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // ── Тема: восстановить сохранённое значение ──────────────────────────────
  const savedTheme = localStorage.getItem(THEME_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    header.setAttribute('data-theme', savedTheme)
  }

  // ── Переключатель темы ────────────────────────────────────────────────────
  const themeToggle = root.querySelector('[data-theme-toggle]')
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = header.getAttribute('data-theme') ?? 'dark'
      const next = current === 'dark' ? 'light' : 'dark'
      header.setAttribute('data-theme', next)
      localStorage.setItem(THEME_KEY, next)
    })
  }

  // ── Aria-expanded sync при открытии overlay ───────────────────────────────
  const menuBtn = root.querySelector('[data-menu-overlay-trigger]')
  if (menuBtn) {
    const overlay = document.querySelector('[data-menu-overlay]')
    if (overlay && typeof MutationObserver !== 'undefined') {
      const mo = new MutationObserver(() => {
        menuBtn.setAttribute('aria-expanded', String(overlay.classList.contains('is-open')))
      })
      mo.observe(overlay, { attributes: true, attributeFilter: ['class'] })
    }
  }
}
