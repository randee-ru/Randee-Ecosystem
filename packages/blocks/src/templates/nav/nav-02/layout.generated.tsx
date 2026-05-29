'use client'

import type { CSSProperties } from 'react'

/** Стрелка ↗ для внешних ссылок */
const Arr = () => (
  <span className="menu-overlay__arr" aria-hidden="true">
    <svg className="menu-overlay__arr-svg" viewBox="0 0 14 14" width="14" height="14" focusable={false} aria-hidden="true">
      <path
        d="M3.5 10.5 L10.5 3.5 M10.5 3.5 H5.5 M10.5 3.5 V8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
)

export type MegaMenuProps = {
  phone?:          string
  phoneHref?:      string
  email?:          string
  emailHref?:      string
  description?:    string
  briefUrl?:       string
  containerWidth?: string
}

export function GeneratedLayout({
  phone          = '+7 999 801‑02-77',
  phoneHref      = 'tel:+79998010277',
  email          = 'info@randee.ru',
  emailHref      = 'mailto:info@randee.ru',
  description    = 'Randee — digital-студия: стратегии превращаем в измеримый результат для брендов.',
  briefUrl       = '#',
  containerWidth = '1464',
}: MegaMenuProps) {
  const containerStyle: CSSProperties = containerWidth === 'full'
    ? { maxWidth: '100%' }
    : { maxWidth: `${containerWidth}px` }

  return (
    <div
      id="menu-site-overlay"
      className="menu-overlay"
      data-menu-overlay=""
      aria-hidden="true"
    >
      <div className="menu-overlay__shell">

        {/* Затемнённый фон — клик закрывает */}
        <div
          className="menu-overlay__backdrop"
          data-menu-overlay-close=""
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Панель */}
        <div
          className="menu-overlay__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-overlay-title"
        >
          {/* Кнопка закрыть */}
          <button
            className="menu-overlay__close"
            type="button"
            data-menu-overlay-close=""
            data-focus=""
            aria-label="Закрыть меню"
          >
            <span className="menu-overlay__close-icon" aria-hidden="true" />
          </button>

          {/* Контент */}
          <div className="menu-overlay__inner">
            <div className="container" style={containerStyle}>
              <div className="row menu-overlay__row">

                {/* ── Колонка 1: главная навигация ── */}
                <div className="col-12 col-md-4 menu-overlay__col">
                  <p id="menu-overlay-title" className="menu-overlay__brand">
                    <span className="menu-overlay__brand-line">МЕ</span>
                    <span className="menu-overlay__brand-line menu-overlay__brand-line--with-icon">
                      <span className="menu-overlay__brand-bars" aria-hidden="true">
                        <span /><span /><span />
                      </span>
                      <span>НЮ</span>
                    </span>
                  </p>
                  <nav className="menu-overlay__nav" aria-label="Основное меню">
                    <a className="menu-overlay__link" href="#">Готовые решения <Arr /></a>
                    <a className="menu-overlay__link" href="#">Про нас <Arr /></a>
                    <a className="menu-overlay__link" href="#">Новости <Arr /></a>
                    <a className="menu-overlay__link" href="#">Кейсы <Arr /></a>
                    <a className="menu-overlay__link" href="#">Контакты</a>
                  </nav>
                </div>

                {/* ── Колонка 2: услуги ── */}
                <div className="col-12 col-md-4 menu-overlay__col">
                  <div className="menu-overlay__block">
                    <a className="menu-overlay__heading-link" href="#">
                      Разработка сайтов <Arr />
                    </a>
                    <nav className="menu-overlay__sub" aria-label="Разработка сайтов">
                      <a className="menu-overlay__link menu-overlay__link--sub" href="#">Лендинг <Arr /></a>
                      <a className="menu-overlay__link menu-overlay__link--sub" href="#">Промо-сайт <Arr /></a>
                      <a className="menu-overlay__link menu-overlay__link--sub" href="#">Сайт-визитка <Arr /></a>
                      <a className="menu-overlay__link menu-overlay__link--sub" href="#">Интернет-магазин <Arr /></a>
                      <a className="menu-overlay__link menu-overlay__link--sub" href="#">Сайт каталог <Arr /></a>
                      <a className="menu-overlay__link menu-overlay__link--sub" href="#">Восстановление сайта <Arr /></a>
                    </nav>
                  </div>
                  <nav className="menu-overlay__nav menu-overlay__nav--tight" aria-label="Услуги">
                    <a className="menu-overlay__link" href="#">SEO продвижение</a>
                    <a className="menu-overlay__link" href="#">Брендинг и дизайн</a>
                    <a className="menu-overlay__link" href="#">Реклама в интернете</a>
                  </nav>
                </div>

                {/* ── Колонка 3: контакты ── */}
                <div className="col-12 col-md-4 menu-overlay__col menu-overlay__col--aside">
                  <p className="menu-overlay__lead">{description}</p>
                  <p className="menu-overlay__phone">
                    <a href={phoneHref}>{phone}</a>
                  </p>
                  <p className="menu-overlay__email">
                    <a href={emailHref}>{email}</a>
                  </p>
                  <div className="menu-overlay__actions">
                    <a className="btn btn-blick menu-overlay__btn" href={briefUrl}>
                      Скачать бриф
                    </a>
                    <button className="menu-overlay__btn-secondary" type="button">
                      Заказать звонок
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
