import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  args: { children: 'New', variant: 'default' }
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Success: Story = { args: { variant: 'success', children: 'Ready' } }
