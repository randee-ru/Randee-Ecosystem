import type { Meta, StoryObj } from '@storybook/react'
import { Faq } from './faq'

const meta = {
  title: 'Sections/FAQ',
  component: Faq,
  args: {
    title: 'Частые вопросы',
    items: [
      { id: '1', question: 'Можно ли экспортировать в Bitrix?', answer: 'Да, это ключевая функция системы.' },
      { id: '2', question: 'Нужны ли знания React?', answer: 'Для кастомизации да, для сборки страниц — минимально.' }
    ]
  }
} satisfies Meta<typeof Faq>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
