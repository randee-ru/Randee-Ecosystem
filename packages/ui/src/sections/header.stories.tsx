import type { Meta, StoryObj } from '@storybook/react'
import { Header } from './header'

const meta = {
  title: 'Sections/Header',
  component: Header,
  args: {
    brand: 'Randee',
    links: [
      { id: '1', label: 'Компоненты', href: '#' },
      { id: '2', label: 'Builder', href: '#' },
      { id: '3', label: 'Marketplace', href: '#' }
    ],
    ctaText: 'Войти'
  }
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
