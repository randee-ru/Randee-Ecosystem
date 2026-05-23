import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from './drawer'

describe('Drawer', () => {
  it('renders content when open', () => {
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerTitle>Title</DrawerTitle>
          <DrawerDescription>Description</DrawerDescription>
        </DrawerContent>
      </Drawer>
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
  })
})
