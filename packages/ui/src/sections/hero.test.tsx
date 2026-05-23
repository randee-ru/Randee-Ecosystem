import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { Hero } from './hero'

describe('Hero', () => {
  it('renders title, description and cta', () => {
    render(
      <Hero
        title="Title"
        description="Description"
        ctaText="Action"
      />
    )

    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })

  it('calls callback on cta click', async () => {
    const onCtaClick = vi.fn()
    render(<Hero title="Title" description="Description" onCtaClick={onCtaClick} />)

    screen.getByRole('button', { name: 'Оставить заявку' }).click()
    expect(onCtaClick).toHaveBeenCalledTimes(1)
  })

  it('has no obvious a11y violations', async () => {
    const { container } = render(<Hero title="Title" description="Description" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
