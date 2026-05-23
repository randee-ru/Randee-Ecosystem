import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Faq } from './faq'

describe('Faq', () => {
  const items = [{ id: '1', question: 'Q1', answer: 'A1' }]

  it('renders title and question', () => {
    render(<Faq title="FAQ" items={items} />)
    expect(screen.getByRole('heading', { name: 'FAQ' })).toBeInTheDocument()
    expect(screen.getByText('Q1')).toBeInTheDocument()
  })

  it('has no obvious a11y violations', async () => {
    const { container } = render(<Faq title="FAQ" items={items} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
