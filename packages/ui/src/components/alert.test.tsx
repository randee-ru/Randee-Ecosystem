import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert } from './alert'

describe('Alert', () => {
  it('renders title and content', () => {
    render(<Alert title="Info">Body</Alert>)
    expect(screen.getByText('Info')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
  })
})
