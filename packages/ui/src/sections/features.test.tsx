import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Features } from './features'

describe('Features', () => {
  const items = [
    { id: '1', title: 'A', description: 'A desc' },
    { id: '2', title: 'B', description: 'B desc' }
  ]

  it('renders section title and feature items', () => {
    render(<Features title="Title" items={items} />)
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B desc')).toBeInTheDocument()
  })

  it('has no obvious a11y violations', async () => {
    const { container } = render(<Features title="Title" items={items} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
