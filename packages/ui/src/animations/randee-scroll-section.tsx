import * as React from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '../lib/cn'
import { useReducedMotion } from '../hooks/use-reduced-motion'

gsap.registerPlugin(ScrollTrigger)

export interface RandeeScrollSectionProps {
  children: React.ReactNode
  className?: string
  enabled?: boolean
  pin?: boolean
  scrub?: boolean | number
}

export function RandeeScrollSection({
  children,
  className,
  enabled = true,
  pin = true,
  scrub = true
}: RandeeScrollSectionProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const reducedMotion = useReducedMotion()

  React.useLayoutEffect(() => {
    if (!ref.current || !enabled || reducedMotion) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top top',
        end: '+=120%',
        pin,
        scrub
      })
    }, ref)

    return () => ctx.revert()
  }, [enabled, pin, reducedMotion, scrub])

  return <section ref={ref} className={cn('relative', className)}>{children}</section>
}
