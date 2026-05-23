import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Breadcrumbs } from './breadcrumbs'

describe('Breadcrumbs', () => {
  it('renders breadcrumb items', () => {
    render(<Breadcrumbs items={[{ label: 'Home', href: '#' }, { label: 'Page' }]} />)
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByText('Page')).toBeInTheDocument()
  })
})
