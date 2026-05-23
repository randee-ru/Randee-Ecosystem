import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders button content', () => {
    render(<Button>Click</Button>)
    expect(screen.getByRole('button', { name: 'Click' })).toBeInTheDocument()
  })

  it('has no obvious a11y violations', async () => {
    const { container } = render(<Button>Submit</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
