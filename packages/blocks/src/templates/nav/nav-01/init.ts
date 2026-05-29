export function init(root: HTMLElement | null): void {
  if (!root) return
  root.classList.add('is-mounted')

  const header = root.querySelector<HTMLElement>('.header')
  if (!header) return

  // ── Scroll → is-scrolled ────────────────────────────────────────────────
  function onScroll(): void {
    header!.classList.toggle('is-scrolled', window.scrollY > 8)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll() // начальное состояние

  // ── Кнопка меню ─────────────────────────────────────────────────────────
  const menuBtn = root.querySelector<HTMLButtonElement>('[data-menu-overlay-trigger]')
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const expanded = menuBtn.getAttribute('aria-expanded') === 'true'
      menuBtn.setAttribute('aria-expanded', String(!expanded))
      // Здесь можно открыть оверлей меню по id из aria-controls
      const overlayId = menuBtn.getAttribute('aria-controls')
      if (overlayId) {
        const overlay = document.getElementById(overlayId)
        if (overlay) overlay.classList.toggle('is-open', !expanded)
      }
    })
  }
}
