import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from './dropdown'

const meta = { title: 'UI/Dropdown', component: Dropdown } satisfies Meta<typeof Dropdown>
export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="secondary">Actions</Button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownItem>Duplicate</DropdownItem>
        <DropdownItem>Delete</DropdownItem>
      </DropdownContent>
    </Dropdown>
  )
}
