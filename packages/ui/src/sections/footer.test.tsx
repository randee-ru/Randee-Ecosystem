import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Footer } from './footer'

describe('Footer', () => {
  const links = [{ id: '1', label: 'GitHub', href: '#' }]

  it('renders brand and link list', () => {
    render(<Footer brand="Randee" description="Desc" links={links} />)
    expect(screen.getByText('Randee')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument()
  })

  it('has no obvious a11y violations', async () => {
    const { container } = render(<Footer brand="Randee" description="Desc" links={links} />)
    const results = await axe(container, {
      rules: {
        'landmark-no-duplicate-contentinfo': { enabled: false }
      }
    })
    expect(results).toHaveNoViolations()
  })
})
