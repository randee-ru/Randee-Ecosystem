import * as React from 'react'
import { Button } from '../components/button'
import { cn } from '../lib/cn'

export interface CtaProps {
  title: string
  description: string
  buttonText?: string
  onClick?: () => void
  className?: string
}

export function Cta({ title, description, buttonText = 'Оставить заявку', onClick, className }: CtaProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-neutral-900 bg-neutral-900 px-6 py-12 text-white md:px-10',
        className
      )}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
          <p className="text-sm text-neutral-300 md:text-base">{description}</p>
        </div>
        <Button variant="secondary" onClick={onClick}>
          {buttonText}
        </Button>
      </div>
    </section>
  )
}
