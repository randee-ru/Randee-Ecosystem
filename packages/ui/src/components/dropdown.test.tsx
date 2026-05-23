import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from './dropdown'

describe('Dropdown', () => {
  it('renders trigger', () => {
    render(
      <Dropdown>
        <DropdownTrigger>Open</DropdownTrigger>
        <DropdownContent>
          <DropdownItem>Item</DropdownItem>
        </DropdownContent>
      </Dropdown>
    )
    expect(screen.getByText('Open')).toBeInTheDocument()
  })
})
