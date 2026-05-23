import * as React from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '../lib/cn'
import { useReducedMotion } from '../hooks/use-reduced-motion'

gsap.registerPlugin(ScrollTrigger)

export interface RandeeParallaxProps {
  children: React.ReactNode
  className?: string
  enabled?: boolean
  speed?: number
}

export function RandeeParallax({ children, className, enabled = true, speed = 0.2 }: RandeeParallaxProps) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const innerRef = React.useRef<HTMLDivElement | null>(null)
  const reducedMotion = useReducedMotion()

  React.useLayoutEffect(() => {
    if (!wrapperRef.current || !innerRef.current || !enabled || reducedMotion) return

    const ctx = gsap.context(() => {
      gsap.to(innerRef.current, {
        yPercent: speed * -100,
        ease: 'none',
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      })
    }, wrapperRef)

    return () => ctx.revert()
  }, [enabled, reducedMotion, speed])

  return (
    <div ref={wrapperRef} className={cn('overflow-hidden', className)}>
      <div ref={innerRef}>{children}</div>
    </div>
  )
}
