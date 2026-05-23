import type { Meta, StoryObj } from '@storybook/react'
import { RandeeMarquee } from './randee-marquee'

const meta = {
  title: 'Animations/RandeeMarquee',
  component: RandeeMarquee,
  args: {
    items: ['Bitrix', 'Tailwind', 'Builder', 'Marketplace'],
    speed: 24,
    enabled: true
  }
} satisfies Meta<typeof RandeeMarquee>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
