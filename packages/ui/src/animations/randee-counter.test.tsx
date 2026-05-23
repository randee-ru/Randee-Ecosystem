import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RandeeCounter } from './randee-counter'

describe('RandeeCounter', () => {
  it('renders initial counter value', () => {
    render(<RandeeCounter from={10} to={100} suffix="+" enabled={false} />)
    expect(screen.getByText('100+')).toBeInTheDocument()
  })
})
