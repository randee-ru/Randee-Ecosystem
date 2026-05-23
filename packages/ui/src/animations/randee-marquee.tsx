import * as React from 'react'
import { gsap } from 'gsap'
import { cn } from '../lib/cn'
import { useReducedMotion } from '../hooks/use-reduced-motion'

export interface RandeeMarqueeProps {
  items: string[]
  speed?: number
  className?: string
  enabled?: boolean
}

export function RandeeMarquee({ items, speed = 30, className, enabled = true }: RandeeMarqueeProps) {
  const trackRef = React.useRef<HTMLDivElement | null>(null)
  const reducedMotion = useReducedMotion()

  React.useLayoutEffect(() => {
    if (!trackRef.current || !enabled || reducedMotion) return

    const ctx = gsap.context(() => {
      gsap.to(trackRef.current, {
        xPercent: -50,
        duration: speed,
        repeat: -1,
        ease: 'none'
      })
    }, trackRef)

    return () => ctx.revert()
  }, [enabled, reducedMotion, speed])

  const renderItems = [...items, ...items]

  return (
    <div className={cn('overflow-hidden whitespace-nowrap', className)}>
      <div ref={trackRef} className="inline-flex min-w-max gap-8 pr-8">
        {renderItems.map((item, index) => (
          <span key={`${item}-${index}`} className="text-sm font-medium text-neutral-700">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
