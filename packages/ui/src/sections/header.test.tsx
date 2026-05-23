import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Header } from './header'

describe('Header', () => {
  const links = [
    { id: '1', label: 'Docs', href: '#' },
    { id: '2', label: 'UI', href: '#' }
  ]

  it('renders brand and nav links', () => {
    render(<Header brand="Randee" links={links} />)
    expect(screen.getByText('Randee')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Docs' })).toBeInTheDocument()
  })

  it('has no obvious a11y violations', async () => {
    const { container } = render(<Header brand="Randee" links={links} />)
    const results = await axe(container, {
      rules: {
        'landmark-no-duplicate-banner': { enabled: false }
      }
    })
    expect(results).toHaveNoViolations()
  })
})
