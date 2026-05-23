import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RandeeScrollSection } from './randee-scroll-section'

describe('RandeeScrollSection', () => {
  it('renders content', () => {
    render(<RandeeScrollSection enabled={false}><div>Scroll content</div></RandeeScrollSection>)
    expect(screen.getByText('Scroll content')).toBeInTheDocument()
  })
})
