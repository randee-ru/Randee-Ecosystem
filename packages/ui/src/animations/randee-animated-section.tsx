import * as React from 'react'
import { cn } from '../lib/cn'
import { RandeeReveal } from './randee-reveal'

export interface RandeeAnimatedSectionProps {
  title: string
  description: string
  className?: string
  enabled?: boolean
}

export function RandeeAnimatedSection({
  title,
  description,
  className,
  enabled = true
}: RandeeAnimatedSectionProps) {
  return (
    <RandeeReveal enabled={enabled} className={cn('rounded-2xl border border-neutral-200 bg-white p-8', className)}>
      <h3 className="text-2xl font-semibold">{title}</h3>
      <p className="mt-3 text-neutral-600">{description}</p>
    </RandeeReveal>
  )
}
