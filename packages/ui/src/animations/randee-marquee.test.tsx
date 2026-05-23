import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RandeeMarquee } from './randee-marquee'

describe('RandeeMarquee', () => {
  it('renders repeated marquee items', () => {
    render(<RandeeMarquee items={['A', 'B']} enabled={false} />)
    expect(screen.getAllByText('A').length).toBeGreaterThan(1)
  })
})
