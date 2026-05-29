/** @param {HTMLElement | null} root */
export function init(root) {
  if (!root) return
  root.classList.add('is-mounted')

  const header = root.querySelector('.header')
  if (!header) return

  // ── Scroll → is-scrolled ────────────────────────────────────────────────
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // ── Кнопка меню ─────────────────────────────────────────────────────────
  const menuBtn = header.querySelector('[data-menu-overlay-trigger]')
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const expanded = menuBtn.getAttribute('aria-expanded') === 'true'
      menuBtn.setAttribute('aria-expanded', String(!expanded))
      const overlayId = menuBtn.getAttribute('aria-controls')
      if (overlayId) {
        const overlay = document.getElementById(overlayId)
        if (overlay) overlay.classList.toggle('is-open', !expanded)
      }
    })
  }
}
