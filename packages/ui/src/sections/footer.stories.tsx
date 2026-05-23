import type { Meta, StoryObj } from '@storybook/react'
import { Footer } from './footer'

const meta = {
  title: 'Sections/Footer',
  component: Footer,
  args: {
    brand: 'Randee',
    description: 'Экосистема быстрой разработки сайтов на Bitrix.',
    links: [
      { id: '1', label: 'Документация', href: '#' },
      { id: '2', label: 'GitHub', href: '#' },
      { id: '3', label: 'Контакты', href: '#' }
    ]
  }
} satisfies Meta<typeof Footer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
