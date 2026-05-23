import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { Cta } from './cta'

describe('Cta', () => {
  it('renders title, description and button', () => {
    render(<Cta title="T" description="D" buttonText="Go" />)
    expect(screen.getByRole('heading', { name: 'T' })).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })

  it('calls click handler', () => {
    const onClick = vi.fn()
    render(<Cta title="T" description="D" onClick={onClick} />)
    screen.getByRole('button', { name: 'Оставить заявку' }).click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('has no obvious a11y violations', async () => {
    const { container } = render(<Cta title="T" description="D" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
