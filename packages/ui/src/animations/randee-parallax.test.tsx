import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RandeeParallax } from './randee-parallax'

describe('RandeeParallax', () => {
  it('renders children', () => {
    render(<RandeeParallax><div>Parallax child</div></RandeeParallax>)
    expect(screen.getByText('Parallax child')).toBeInTheDocument()
  })

  it('supports disabled state', () => {
    render(<RandeeParallax enabled={false}><div>No motion</div></RandeeParallax>)
    expect(screen.getByText('No motion')).toBeInTheDocument()
  })

  it('respects prefers-reduced-motion', () => {
    const matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })

    vi.stubGlobal('matchMedia', matchMedia)

    render(<RandeeParallax><div>Reduced motion</div></RandeeParallax>)
    expect(screen.getByText('Reduced motion')).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
