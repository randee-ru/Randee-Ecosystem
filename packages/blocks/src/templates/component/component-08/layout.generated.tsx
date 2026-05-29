'use client'

import type { CSSProperties } from 'react'

const slideFr = (value: number): CSSProperties =>
  ({ ['--slide-fr' as string]: value }) as CSSProperties

export type SlideItem = {
  /** URL видео (mp4). Если задан — карточка video, иначе image. */
  videoSrc: string
  /** URL фонового изображения (если нет видео). */
  imageSrc: string
  /** Заголовок карточки. */
  title: string
  /** Ширина слайда в долях (1 = 1/4 сетки, 2 = 2/4 и т.д.). */
  span: number
}

/** Статические данные — показываются пока CMS не загрузилась / нет элементов */
const FALLBACK_ITEMS: SlideItem[] = [
  { videoSrc: '/builder-media/49f642996e12_gas-taxi.mp4', imageSrc: '', title: 'GAS Такси', span: 1 },
  { videoSrc: '/builder-media/46659d1677f3_movi-01.mp4',  imageSrc: '', title: 'DemiroFF',  span: 2 },
  { videoSrc: '/builder-media/video-2_2.mp4',             imageSrc: '', title: 'Металлург', span: 1 },
]

type Props = {
  /**
   * Слайды для рендера. Если не переданы (или пустой массив) —
   * используются FALLBACK_ITEMS (статические демо-данные).
   */
  items?: SlideItem[]
  /** Ширина контейнера: '1296' | '1464' | '1696' | 'full'. */
  containerWidth?: string
}

export function GeneratedLayout({ items, containerWidth }: Props) {
  const slides = items && items.length > 0 ? items : FALLBACK_ITEMS
  const containerStyle = containerWidth
    ? (containerWidth === 'full'
        ? { '--hero-items-container-max': '100%', '--hero-items-container-gutter': '0px' } as CSSProperties
        : { '--hero-items-container-max': `${containerWidth}px` } as CSSProperties)
    : undefined

  return (
    <section className="hero-items" aria-labelledby="hero-items-heading">
      <div className="container" style={containerStyle}>
        <header className="hero-items__head">
          <h2 className="hero-items__heading" id="hero-items-heading">
            <span className="hero-items__heading-line hero-items__heading-line--accent">
              С печи монтажа
            </span>
            <span className="hero-items__heading-line hero-items__heading-line--tag">
              на вашу витрину — пока пар идёт
            </span>
          </h2>

          <p className="hero-items__lead">
            Свежие кейсы и релизы: без «тёплой полки» и очереди в архив
          </p>
        </header>

        <div className="hero-items__slider-wrap">
          <div className="swiper hero-items__slider" data-hero-items-swiper>
            <div className="swiper-wrapper">
              {slides.map((item, index) => (
                <div
                  key={index}
                  className="swiper-slide hero-items__slide"
                  style={slideFr(item.span)}
                  data-hero-items-span={String(item.span)}
                >
                  {item.videoSrc ? (
                    <article className="hero-items__card hero-items__card--video">
                      <video
                        className="hero-items__video"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        aria-hidden="true"
                      >
                        <source src={item.videoSrc} type="video/mp4" />
                      </video>
                      <h3 className="hero-items__title">{item.title}</h3>
                    </article>
                  ) : (
                    <article className="hero-items__card hero-items__card--image">
                      <span
                        className="hero-items__bg"
                        aria-hidden="true"
                        style={{ backgroundImage: `url('${item.imageSrc}')` }}
                      />
                      <h3 className="hero-items__title">{item.title}</h3>
                    </article>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            className="hero-items__nav hero-items__nav--prev"
            type="button"
            data-hero-items-prev
            aria-label="Предыдущие карточки"
          >
            <span aria-hidden="true">←</span>
          </button>

          <button
            className="hero-items__nav hero-items__nav--next"
            type="button"
            data-hero-items-next
            aria-label="Следующие карточки"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  )
}
