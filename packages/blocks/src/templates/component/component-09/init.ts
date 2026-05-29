const THEME_KEY = 'randee-header-theme'

export function init(root: HTMLElement | null): void {
  if (!root) return
  root.classList.add('is-mounted')

  const header = root.querySelector<HTMLElement>('.header')
  if (!header) return

  // ── Scroll → is-scrolled ─────────────────────────────────────────────────
  function onScroll(): void {
    header!.classList.toggle('is-scrolled', window.scrollY > 8)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // ── Тема: восстановить сохранённое значение ──────────────────────────────
  const savedTheme = localStorage.getItem(THEME_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    header.setAttribute('data-theme', savedTheme)
  }

  // ── Переключатель тёмная/светлая тема ────────────────────────────────────
  const themeToggle = root.querySelector<HTMLButtonElement>('[data-theme-toggle]')
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = header.getAttribute('data-theme') ?? 'dark'
      const next = current === 'dark' ? 'light' : 'dark'
      header.setAttribute('data-theme', next)
      localStorage.setItem(THEME_KEY, next)
    })
  }

  // ── Кнопка меню (открытие глобального overlay) ───────────────────────────
  // Основная логика в nav-02/init.ts через data-menu-overlay-trigger
  // Здесь — aria-expanded для a11y
  const menuBtn = root.querySelector<HTMLButtonElement>('[data-menu-overlay-trigger]')
  if (menuBtn) {
    const overlay = document.querySelector('[data-menu-overlay]')
    if (overlay) {
      const mo = new MutationObserver(() => {
        const isOpen = overlay.classList.contains('is-open')
        menuBtn.setAttribute('aria-expanded', String(isOpen))
      })
      mo.observe(overlay, { attributes: true, attributeFilter: ['class'] })
    }
  }
}
