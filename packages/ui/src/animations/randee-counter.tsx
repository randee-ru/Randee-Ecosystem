import * as React from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '../lib/cn'
import { useReducedMotion } from '../hooks/use-reduced-motion'

gsap.registerPlugin(ScrollTrigger)

export interface RandeeCounterProps {
  from?: number
  to: number
  duration?: number
  suffix?: string
  className?: string
  enabled?: boolean
}

export function RandeeCounter({
  from = 0,
  to,
  duration = 1.2,
  suffix = '',
  className,
  enabled = true
}: RandeeCounterProps) {
  const ref = React.useRef<HTMLSpanElement | null>(null)
  const reducedMotion = useReducedMotion()

  React.useLayoutEffect(() => {
    if (!ref.current) return

    if (!enabled || reducedMotion) {
      ref.current.textContent = `${Math.round(to)}${suffix}`
      return
    }

    const state = { value: from }
    const ctx = gsap.context(() => {
      gsap.to(state, {
        value: to,
        duration,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 90%',
          once: true
        },
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent = `${Math.round(state.value)}${suffix}`
          }
        }
      })
    }, ref)

    return () => ctx.revert()
  }, [duration, enabled, from, reducedMotion, suffix, to])

  return (
    <span ref={ref} className={cn(className)}>
      {`${Math.round(from)}${suffix}`}
    </span>
  )
}
