'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/components/theme-provider'

const STORAGE_KEY = 'randee-floating-orb-position'
const ORB_SIZE = 132
const ORB_MARGIN = 24

type OrbPosition = {
  x: number
  y: number
}

type DragState = {
  active: boolean
  pointerId: number | null
  offsetX: number
  offsetY: number
  moved: boolean
}

type CursorPoint = {
  x: number
  y: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function readSavedPosition(): OrbPosition | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<OrbPosition>
    if (!isFiniteNumber(parsed.x) || !isFiniteNumber(parsed.y)) return null
    return { x: parsed.x, y: parsed.y }
  } catch {
    return null
  }
}

function defaultPosition(): OrbPosition {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  return {
    x: Math.max(ORB_SIZE / 2 + ORB_MARGIN, window.innerWidth - ORB_SIZE / 2 - 32),
    y: Math.max(ORB_SIZE / 2 + ORB_MARGIN, window.innerHeight - ORB_SIZE / 2 - 32),
  }
}

function normalizePosition(position: OrbPosition): OrbPosition {
  if (typeof window === 'undefined') return position
  const half = ORB_SIZE / 2
  return {
    x: clamp(position.x, half + ORB_MARGIN, window.innerWidth - half - ORB_MARGIN),
    y: clamp(position.y, half + ORB_MARGIN, window.innerHeight - half - ORB_MARGIN),
  }
}

export function FloatingOrb() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [position, setPosition] = React.useState<OrbPosition | null>(null)
  const [cursor, setCursor] = React.useState<CursorPoint>({ x: 0, y: 0 })
  const [isPressed, setIsPressed] = React.useState(false)
  const [showHearts, setShowHearts] = React.useState(false)
  const [pulseKey, setPulseKey] = React.useState(0)
  const dragRef = React.useRef<DragState>({ active: false, pointerId: null, offsetX: 0, offsetY: 0, moved: false })
  const suppressClickRef = React.useRef(false)
  const cursorFrameRef = React.useRef<number | null>(null)
  const cursorTargetRef = React.useRef<CursorPoint>({ x: 0, y: 0 })
  const heartsTimeoutRef = React.useRef<number | null>(null)
  const orbButtonRef = React.useRef<HTMLButtonElement | null>(null)

  React.useEffect(() => {
    setMounted(true)
    const saved = readSavedPosition()
    setPosition(normalizePosition(saved ?? defaultPosition()))
  }, [])

  React.useEffect(() => {
    if (!mounted || !position) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position))
  }, [mounted, position])

  React.useEffect(() => {
    if (!mounted) return
    const onResize = () => {
      setPosition((current) => (current ? normalizePosition(current) : current))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [mounted])

  React.useEffect(() => {
    if (!mounted) return

    const updateCursor = () => {
      cursorFrameRef.current = null
      setCursor(cursorTargetRef.current)
    }

    const scheduleCursor = (clientX: number, clientY: number) => {
      const rect = orbButtonRef.current?.getBoundingClientRect()
      const centerX = rect ? rect.left + rect.width / 2 : position?.x ?? defaultPosition().x
      const centerY = rect ? rect.top + rect.height / 2 : position?.y ?? defaultPosition().y
      const x = (clientX - centerX) / (ORB_SIZE * 0.46)
      const y = (clientY - centerY) / (ORB_SIZE * 0.46)
      cursorTargetRef.current = {
        x: clamp(x, -0.62, 0.62),
        y: clamp(y, -0.62, 0.62),
      }

      if (cursorFrameRef.current != null) return
      cursorFrameRef.current = window.requestAnimationFrame(updateCursor)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      scheduleCursor(event.clientX, event.clientY)
    }

    const onMouseMove = (event: MouseEvent) => {
      scheduleCursor(event.clientX, event.clientY)
    }

    const onPointerLeave = () => {
      cursorTargetRef.current = { x: 0, y: 0 }
      if (cursorFrameRef.current != null) return
      cursorFrameRef.current = window.requestAnimationFrame(updateCursor)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('blur', onPointerLeave)
    window.addEventListener('pointerleave', onPointerLeave as EventListener)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('blur', onPointerLeave)
      window.removeEventListener('pointerleave', onPointerLeave as EventListener)
      if (cursorFrameRef.current != null) {
        window.cancelAnimationFrame(cursorFrameRef.current)
        cursorFrameRef.current = null
      }
    }
  }, [mounted, position])

  if (!mounted || !position) return null
  if (pathname.startsWith('/login')) return null

  const finishInteraction = () => {
    setIsPressed(false)
    dragRef.current.active = false
    dragRef.current.pointerId = null
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y,
      moved: false,
    }
    setIsPressed(true)
    setShowHearts(true)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== event.pointerId) return

    const nextPosition = normalizePosition({
      x: event.clientX - dragRef.current.offsetX,
      y: event.clientY - dragRef.current.offsetY,
    })

    if (Math.abs(nextPosition.x - position.x) > 2 || Math.abs(nextPosition.y - position.y) > 2) {
      dragRef.current.moved = true
      setPosition(nextPosition)
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Ignore release errors when capture already changed.
    }

    if (!dragRef.current.moved) {
      setPulseKey((current) => current + 1)
    }

    setShowHearts(false)
    if (heartsTimeoutRef.current != null) {
      window.clearTimeout(heartsTimeoutRef.current)
      heartsTimeoutRef.current = null
    }

    setPosition((current) => (current ? normalizePosition(current) : current))
    finishInteraction()
  }

  const handlePointerCancel = () => {
    setShowHearts(false)
    finishInteraction()
  }

  const handleClick = () => {
    if (suppressClickRef.current) return
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    setPulseKey((current) => current + 1)
    setShowHearts(true)
  }

  const shellShadow = theme === 'dark'
    ? '0 28px 70px rgb(0 0 0 / 0.32)'
    : '0 34px 90px rgb(15 23 42 / 0.24)'

  const orbPalette = theme === 'dark'
    ? {
        shell: 'linear-gradient(145deg, rgb(255 255 255 / 0.28), rgb(255 255 255 / 0.05) 22%, rgb(0 0 0 / 0.16) 100%)',
        fill: 'radial-gradient(circle at 22% 22%, rgb(255 255 255 / 0.88), transparent 12%), radial-gradient(circle at 28% 74%, rgb(52 186 255 / 0.98), transparent 14%), radial-gradient(circle at 66% 72%, rgb(255 88 208 / 0.92), transparent 18%), radial-gradient(circle at 66% 28%, rgb(16 10 52 / 0.98), transparent 30%), radial-gradient(circle at 54% 56%, rgb(84 47 255 / 0.92), rgb(25 9 76 / 0.98) 36%, rgb(3 4 12 / 1) 76%)',
        sheen: 'linear-gradient(135deg, rgb(255 255 255 / 0.78), rgb(255 255 255 / 0.12) 30%, transparent 56%)',
        core: 'radial-gradient(circle at 40% 34%, rgb(8 7 26 / 0.18), transparent 16%), radial-gradient(circle at 56% 46%, rgb(6 8 32 / 0.96), rgb(7 8 24 / 0.96) 52%, rgb(2 4 12 / 1) 100%)',
        glow: 'radial-gradient(circle at 50% 50%, rgb(255 64 220 / 0.30), transparent 54%)',
        blueGlint: 'radial-gradient(circle at 30% 40%, rgb(48 206 255 / 1), transparent 28%)',
        pinkGlint: 'radial-gradient(circle at 68% 62%, rgb(255 95 214 / 0.96), transparent 30%)',
        visor: 'linear-gradient(180deg, rgb(8 10 18 / 0.78), rgb(2 3 7 / 0.92))',
        eye: 'rgb(151 255 35)',
        eyeGlow: '0 0 12px rgb(151 255 35 / 0.95), 0 0 22px rgb(151 255 35 / 0.55)',
        rim: 'inset 0 0 0 1px rgb(255 255 255 / 0.16), inset 0 -18px 26px rgb(0 0 0 / 0.34), inset 0 16px 22px rgb(255 255 255 / 0.08)',
      }
    : {
        shell: 'linear-gradient(145deg, rgb(255 255 255 / 0.92), rgb(255 255 255 / 0.34) 24%, rgb(0 0 0 / 0.05) 100%)',
        fill: 'radial-gradient(circle at 22% 22%, rgb(255 255 255 / 0.98), transparent 12%), radial-gradient(circle at 28% 74%, rgb(109 217 255 / 0.92), transparent 14%), radial-gradient(circle at 66% 72%, rgb(255 146 225 / 0.68), transparent 18%), radial-gradient(circle at 66% 28%, rgb(36 32 90 / 0.88), transparent 30%), radial-gradient(circle at 54% 56%, rgb(132 104 255 / 0.78), rgb(55 30 124 / 0.84) 38%, rgb(14 18 30 / 0.92) 76%)',
        sheen: 'linear-gradient(135deg, rgb(255 255 255 / 0.98), rgb(255 255 255 / 0.26) 24%, transparent 56%)',
        core: 'radial-gradient(circle at 40% 34%, rgb(8 7 26 / 0.04), transparent 16%), radial-gradient(circle at 56% 46%, rgb(10 11 38 / 0.70), rgb(12 12 34 / 0.86) 52%, rgb(7 10 20 / 0.98) 100%)',
        glow: 'radial-gradient(circle at 50% 50%, rgb(0 153 255 / 0.14), transparent 54%)',
        blueGlint: 'radial-gradient(circle at 30% 40%, rgb(82 206 255 / 0.78), transparent 28%)',
        pinkGlint: 'radial-gradient(circle at 68% 62%, rgb(255 156 226 / 0.58), transparent 30%)',
        visor: 'linear-gradient(180deg, rgb(24 27 38 / 0.80), rgb(8 10 14 / 0.94))',
        eye: 'rgb(142 255 40)',
        eyeGlow: '0 0 12px rgb(142 255 40 / 0.90), 0 0 20px rgb(142 255 40 / 0.42)',
        rim: 'inset 0 0 0 1px rgb(255 255 255 / 0.22), inset 0 -16px 22px rgb(0 0 0 / 0.22), inset 0 18px 24px rgb(255 255 255 / 0.10)',
      }

  const eyeOffsetX = cursor.x * 2.1
  const eyeOffsetY = cursor.y * 1.6
  const headTiltX = cursor.y * -5.5
  const headTiltY = cursor.x * 6.5
  const pupilScale = isPressed ? 0.92 : 1

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Перетащить декоративную модель"
        title="Перетащи меня"
        ref={orbButtonRef}
        className="pointer-events-auto absolute select-none rounded-full border-0 bg-transparent p-0 outline-none"
        style={{
          left: position.x,
          top: position.y,
          width: ORB_SIZE,
          height: ORB_SIZE,
          transform: 'translate(-50%, -50%)',
          cursor: dragRef.current.active ? 'grabbing' : 'grab',
          touchAction: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <div
          className="relative h-full w-full"
          style={{
            filter: `drop-shadow(0 16px 24px rgb(0 0 0 / ${theme === 'dark' ? 0.24 : 0.12}))`,
            animation: isPressed
              ? 'randee-orb-press 280ms cubic-bezier(0.16, 1, 0.3, 1) both'
              : 'randee-orb-float 7s ease-in-out infinite',
          }}
          key={pulseKey}
        >
          <div
            className="absolute left-1/2 top-[63%] h-[20%] w-[64%] -translate-x-1/2 rounded-full"
            style={{
              background: theme === 'dark'
                ? 'radial-gradient(circle, rgb(0 0 0 / 0.42), transparent 72%)'
                : 'radial-gradient(circle, rgb(15 23 42 / 0.26), transparent 72%)',
              filter: 'blur(18px)',
              opacity: isPressed ? 0.48 : 0.72,
              transform: 'translateX(-50%) scale(1.1, 0.84)',
              zIndex: 0,
            }}
          />
          <div
            className="absolute inset-[10px]"
            style={{
              borderRadius: '44% 56% 52% 48% / 42% 48% 52% 58%',
              background: orbPalette.shell,
              boxShadow: shellShadow,
              transform: isPressed
                ? `scale(0.98) scaleY(0.92) rotateX(${headTiltX * 0.6}deg) rotateY(${headTiltY * 0.6}deg)`
                : `scaleY(0.94) rotateX(${headTiltX}deg) rotateY(${headTiltY}deg)`,
              transition: 'transform 180ms ease, filter 180ms ease, box-shadow 180ms ease',
              overflow: 'hidden',
              willChange: 'transform, border-radius',
              animation: 'randee-orb-morph 8.5s ease-in-out infinite',
              zIndex: 2,
            }}
          >
            <div
              className="absolute inset-[2%]"
              style={{
                borderRadius: 'inherit',
                background: theme === 'dark'
                  ? 'radial-gradient(circle at 30% 18%, rgb(255 255 255 / 0.34), transparent 20%), radial-gradient(circle at 55% 78%, rgb(0 0 0 / 0.26), transparent 36%)'
                  : 'radial-gradient(circle at 28% 16%, rgb(255 255 255 / 0.52), transparent 18%), radial-gradient(circle at 55% 80%, rgb(15 23 42 / 0.22), transparent 38%)',
                mixBlendMode: 'screen',
                filter: 'blur(0.8px)',
                opacity: 0.9,
                zIndex: 0,
              }}
            />

            <div
              className="absolute inset-0"
              style={{
                borderRadius: 'inherit',
                background: orbPalette.fill,
                mixBlendMode: theme === 'dark' ? 'screen' : 'normal',
                opacity: 1,
                filter: 'saturate(1.22) contrast(1.05)',
                zIndex: 0,
              }}
            />

            <div
              className="absolute inset-[7%]"
              style={{
                borderRadius: 'inherit',
                background: theme === 'dark'
                  ? 'radial-gradient(circle at 32% 25%, rgb(255 255 255 / 0.28), transparent 18%), radial-gradient(circle at 64% 70%, rgb(0 0 0 / 0.34), transparent 42%)'
                  : 'radial-gradient(circle at 32% 25%, rgb(255 255 255 / 0.46), transparent 18%), radial-gradient(circle at 64% 70%, rgb(15 23 42 / 0.16), transparent 42%)',
                mixBlendMode: 'screen',
                opacity: 0.82,
                filter: 'blur(1.6px)',
                zIndex: 0,
              }}
            />

            <div
              className="absolute inset-[12%]"
              style={{
                borderRadius: 'inherit',
                background: orbPalette.sheen,
                transform: 'rotate(-16deg) translateY(-2%)',
                opacity: 0.98,
                filter: 'blur(0.6px)',
                mixBlendMode: 'screen',
                animation: 'randee-orb-sheen 9.5s linear infinite',
                zIndex: 1,
              }}
            />

            <div
              className="absolute inset-[14%]"
              style={{
                borderRadius: '42% 58% 50% 50% / 44% 46% 54% 56%',
                background: orbPalette.blueGlint,
                filter: 'blur(7px)',
                opacity: 1,
                mixBlendMode: 'screen',
                zIndex: 2,
                animation: 'randee-orb-glint-float 5.8s ease-in-out infinite',
              }}
            />

            <div
              className="absolute inset-[16%]"
              style={{
                borderRadius: '50% 50% 54% 46% / 42% 56% 44% 58%',
                background: orbPalette.pinkGlint,
                filter: 'blur(8px)',
                opacity: 0.92,
                mixBlendMode: 'screen',
                zIndex: 2,
                animation: 'randee-orb-glint-float 7.2s ease-in-out infinite reverse',
              }}
            />

            <div
              className="absolute inset-[18%]"
              style={{
                borderRadius: '42% 58% 49% 51% / 44% 46% 54% 56%',
                background: orbPalette.core,
                mixBlendMode: 'multiply',
                filter: 'blur(1px)',
                opacity: 0.90,
                transform: 'scale(1.02, 0.98)',
                zIndex: 2,
              }}
            />

            <div
              className="absolute left-1/2 top-[33%] h-[28%] w-[56%] -translate-x-1/2"
              style={{
                borderRadius: '999px',
                background: theme === 'dark'
                  ? 'linear-gradient(180deg, rgb(18 20 28 / 0.92), rgb(5 6 10 / 0.98))'
                  : 'linear-gradient(180deg, rgb(22 24 34 / 0.90), rgb(8 10 14 / 0.96))',
                boxShadow: 'inset 0 10px 18px rgb(255 255 255 / 0.04), inset 0 -12px 22px rgb(0 0 0 / 0.62), 0 0 0 1px rgb(255 255 255 / 0.08)',
                border: '1px solid rgb(255 255 255 / 0.12)',
                opacity: 0.99,
                overflow: 'hidden',
                zIndex: 30,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  borderRadius: 'inherit',
                  boxShadow: orbPalette.rim,
                  opacity: 1,
                  pointerEvents: 'none',
                }}
              />
              <div
                className="absolute inset-[8%] flex items-center justify-between px-[18%]"
                style={{ zIndex: 40 }}
              >
                <div
                  className="randee-orb-eye"
                  style={{
                    animationDelay: '0.35s, 0.4s',
                    overflow: showHearts ? 'visible' : 'hidden',
                  }}
                >
                  <span
                    className="randee-orb-eye-core"
                    style={{
                      background: orbPalette.eye,
                      boxShadow: orbPalette.eyeGlow,
                      transform: `translate3d(${eyeOffsetX * 0.45}px, ${eyeOffsetY * 0.35}px, 0) scale(${isPressed ? 0.985 : 1})`,
                      opacity: showHearts ? 0 : 1,
                    }}
                  />
                  {showHearts ? (
                    <span
                      className="randee-orb-eye-heart"
                      style={{
                        transform: 'translate(-50%, calc(-50% + 2px))',
                        zIndex: 3,
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
                        <path
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  ) : null}
                </div>
                <div
                  className="randee-orb-eye"
                  style={{
                    animationDelay: '1.65s, 1.1s',
                    overflow: showHearts ? 'visible' : 'hidden',
                  }}
                >
                  <span
                    className="randee-orb-eye-core"
                    style={{
                      background: orbPalette.eye,
                      boxShadow: orbPalette.eyeGlow,
                      transform: `translate3d(${eyeOffsetX * 0.35}px, ${eyeOffsetY * 0.28}px, 0) scale(${isPressed ? 0.985 : 1})`,
                      opacity: showHearts ? 0 : 1,
                    }}
                  />
                  {showHearts ? (
                    <span
                      className="randee-orb-eye-heart"
                      style={{
                        transform: 'translate(-50%, calc(-50% + 2px))',
                        zIndex: 3,
                      }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
                        <path
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  ) : null}
                </div>
              </div>
              <div
                className="absolute inset-x-[18%] top-[18%] h-[14%] rounded-full"
                style={{
                  background: 'linear-gradient(180deg, rgb(255 255 255 / 0.18), transparent)',
                  opacity: isPressed ? 0.9 : 0.5,
                  transform: isPressed ? 'translateY(-1px)' : 'translateY(0)',
                  zIndex: 31,
                }}
              />
              <div
                className="absolute left-[14%] top-[12%] h-[18%] w-[28%]"
                style={{
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, rgb(255 255 255 / 0.84), transparent 72%)',
                  filter: 'blur(0.4px)',
                  opacity: theme === 'dark' ? 0.72 : 0.86,
                  transform: 'rotate(-14deg)',
                  zIndex: 32,
                }}
              />
              <div
                className="absolute right-[18%] bottom-[16%] h-[14%] w-[18%]"
                style={{
                  borderRadius: '999px',
                  background: 'radial-gradient(circle, rgb(255 255 255 / 0.24), transparent 68%)',
                  filter: 'blur(0.5px)',
                  opacity: theme === 'dark' ? 0.58 : 0.42,
                  zIndex: 32,
                }}
              />
            </div>

            <div
              className="absolute inset-[14%]"
              style={{
                borderRadius: 'inherit',
                background: orbPalette.glow,
                filter: 'blur(10px)',
                opacity: 0.95,
                transform: 'scale(1.02)',
                zIndex: 10,
              }}
            />

            <div
              className="absolute inset-[10%]"
              style={{
                borderRadius: 'inherit',
                border: '1px solid rgb(255 255 255 / 0.22)',
                boxShadow: 'inset 0 0 26px rgb(255 255 255 / 0.14), inset 0 -24px 30px rgb(0 0 0 / 0.30)',
                opacity: 0.78,
                zIndex: 20,
              }}
            />
          </div>
        </div>
      </button>
    </div>
  )
}
