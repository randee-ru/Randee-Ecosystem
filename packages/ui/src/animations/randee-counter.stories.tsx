import type { Meta, StoryObj } from '@storybook/react'
import { RandeeCounter } from './randee-counter'

const meta = {
  title: 'Animations/RandeeCounter',
  component: RandeeCounter,
  args: {
    from: 0,
    to: 120,
    suffix: '+',
    enabled: true
  }
} satisfies Meta<typeof RandeeCounter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
