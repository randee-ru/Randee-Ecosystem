import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Card, CardContent, CardHeader, CardTitle } from './card'

describe('Card', () => {
  it('renders card with title and content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Description</CardContent>
      </Card>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('has no obvious a11y violations', async () => {
    const { container } = render(
      <Card>
        <CardContent>Body</CardContent>
      </Card>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
