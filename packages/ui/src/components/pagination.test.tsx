import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './pagination'

describe('Pagination', () => {
  it('renders current page', () => {
    render(<Pagination page={2} totalPages={5} />)
    expect(screen.getByText('2 / 5')).toBeInTheDocument()
  })

  it('calls onPageChange', () => {
    const onPageChange = vi.fn()
    const { container } = render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />)
    within(container).getByRole('button', { name: 'Вперед' }).click()
    expect(onPageChange).toHaveBeenCalledWith(3)
  })
})
