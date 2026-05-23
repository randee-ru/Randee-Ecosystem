import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RandeeReveal } from './randee-reveal'

describe('RandeeReveal', () => {
  it('renders children', () => {
    render(<RandeeReveal><div>Animated</div></RandeeReveal>)
    expect(screen.getByText('Animated')).toBeInTheDocument()
  })

  it('supports disabled state', () => {
    render(<RandeeReveal enabled={false}><div>Disabled animation</div></RandeeReveal>)
    expect(screen.getByText('Disabled animation')).toBeInTheDocument()
  })

  it('respects prefers-reduced-motion', () => {
    const matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })

    vi.stubGlobal('matchMedia', matchMedia)

    render(<RandeeReveal><div>Reduced motion</div></RandeeReveal>)
    expect(screen.getByText('Reduced motion')).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
