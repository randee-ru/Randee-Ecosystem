import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Loader } from './loader'

describe('Loader', () => {
  it('renders label', () => {
    render(<Loader label="Loading" />)
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })
})
