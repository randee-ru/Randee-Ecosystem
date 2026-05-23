import * as React from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '../lib/cn'
import { useReducedMotion } from '../hooks/use-reduced-motion'

gsap.registerPlugin(ScrollTrigger)

export interface RandeeRevealProps {
  children: React.ReactNode
  className?: string
  enabled?: boolean
  duration?: number
  y?: number
  once?: boolean
  delay?: number
}

export function RandeeReveal({
  children,
  className,
  enabled = true,
  duration = 0.8,
  y = 24,
  once = true,
  delay = 0
}: RandeeRevealProps) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const reducedMotion = useReducedMotion()

  React.useLayoutEffect(() => {
    if (!ref.current || !enabled || reducedMotion) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration,
          delay,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 85%',
            once
          }
        }
      )
    }, ref)

    return () => ctx.revert()
  }, [delay, duration, enabled, once, reducedMotion, y])

  return <div ref={ref} className={cn(className)}>{children}</div>
}
