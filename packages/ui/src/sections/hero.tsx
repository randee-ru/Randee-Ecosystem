import * as React from 'react'
import { Button } from '../components/button'
import { cn } from '../lib/cn'

export interface HeroProps {
  title: string
  description: string
  ctaText?: string
  onCtaClick?: () => void
  className?: string
  align?: 'left' | 'center'
}

export function Hero({
  title,
  description,
  ctaText = 'Оставить заявку',
  onCtaClick,
  className,
  align = 'left'
}: HeroProps) {
  const isCenter = align === 'center'

  return (
    <section
      className={cn(
        'rounded-2xl border border-neutral-200 bg-white px-6 py-14 md:px-10',
        isCenter && 'text-center',
        className
      )}
    >
      <div className={cn('mx-auto max-w-3xl space-y-6', !isCenter && 'md:mx-0')}>
        <h1 className="text-3xl font-semibold leading-tight md:text-5xl">{title}</h1>
        <p className="text-base text-neutral-600 md:text-lg">{description}</p>
        <div>
          <Button onClick={onCtaClick}>{ctaText}</Button>
        </div>
      </div>
    </section>
  )
}
