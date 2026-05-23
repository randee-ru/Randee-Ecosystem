import type { Meta, StoryObj } from '@storybook/react'
import { Features } from './features'

const meta = {
  title: 'Sections/Features',
  component: Features,
  args: {
    title: 'Почему Randee',
    items: [
      { id: '1', title: 'Tailwind-first', description: 'UI-система на utility-first подходе.' },
      { id: '2', title: 'Bitrix Export', description: 'Экспорт в структуру компонентов Bitrix.' },
      { id: '3', title: 'Builder', description: 'Drag-and-drop сборка страниц.' }
    ]
  }
} satisfies Meta<typeof Features>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
