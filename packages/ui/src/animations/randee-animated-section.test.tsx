import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RandeeAnimatedSection } from './randee-animated-section'

describe('RandeeAnimatedSection', () => {
  it('renders title and description', () => {
    render(<RandeeAnimatedSection title="Title" description="Description" enabled={false} />)
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })
})
