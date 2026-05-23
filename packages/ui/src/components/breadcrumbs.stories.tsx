import type { Meta, StoryObj } from '@storybook/react'
import { Breadcrumbs } from './breadcrumbs'

const meta = {
  title: 'UI/Breadcrumbs',
  component: Breadcrumbs,
  args: {
    items: [
      { label: 'Главная', href: '#' },
      { label: 'Каталог', href: '#' },
      { label: 'Страница' }
    ]
  }
} satisfies Meta<typeof Breadcrumbs>

export default meta

type Story = StoryObj<typeof meta>
export const Default: Story = {}
