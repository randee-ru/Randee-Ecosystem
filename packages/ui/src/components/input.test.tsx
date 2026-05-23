import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Input } from './input'

describe('Input', () => {
  it('renders input by placeholder', () => {
    render(<Input placeholder="Email" />)
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
  })

  it('has no obvious a11y violations', async () => {
    const { container } = render(<Input aria-label="Email" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
