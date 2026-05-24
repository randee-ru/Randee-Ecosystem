import type { CSSProperties } from 'react'

type TouchPoint = { x: number; y: number }

export function touchPairDistance(touches: TouchList): number {
  if (touches.length < 2) return 0
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.hypot(dx, dy)
}

export function touchPairCenter(touches: TouchList): TouchPoint {
  if (touches.length < 2) {
    return { x: touches[0]?.clientX ?? 0, y: touches[0]?.clientY ?? 0 }
  }
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2
  }
}

type CanvasPinchHandlers = {
  onPinchStart: (distance: number, focal: TouchPoint) => void
  onPinchMove: (distance: number, focal: TouchPoint) => void
  onPinchEnd: () => void
}

export function attachCanvasPinchZoom(host: HTMLElement, handlers: CanvasPinchHandlers) {
  let active = false

  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 2) return
    active = true
    handlers.onPinchStart(touchPairDistance(event.touches), touchPairCenter(event.touches))
  }

  const onTouchMove = (event: TouchEvent) => {
    if (!active || event.touches.length !== 2) return
    event.preventDefault()
    handlers.onPinchMove(touchPairDistance(event.touches), touchPairCenter(event.touches))
  }

  const endPinch = (event: TouchEvent) => {
    if (event.touches.length >= 2) return
    if (!active) return
    active = false
    handlers.onPinchEnd()
  }

  host.addEventListener('touchstart', onTouchStart, { passive: true, capture: true })
  host.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
  host.addEventListener('touchend', endPinch, { capture: true })
  host.addEventListener('touchcancel', endPinch, { capture: true })

  return () => {
    host.removeEventListener('touchstart', onTouchStart, true)
    host.removeEventListener('touchmove', onTouchMove, true)
    host.removeEventListener('touchend', endPinch, true)
    host.removeEventListener('touchcancel', endPinch, true)
  }
}

export const CANVAS_TOUCH_STYLES: CSSProperties = {
  touchAction: 'pan-x pan-y',
  WebkitOverflowScrolling: 'touch'
}

export const CANVAS_PAN_TOUCH_STYLES: CSSProperties = {
  touchAction: 'none',
  WebkitOverflowScrolling: 'touch'
}
