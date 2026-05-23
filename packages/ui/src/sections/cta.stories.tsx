import type { Meta, StoryObj } from '@storybook/react'
import { Cta } from './cta'

const meta = {
  title: 'Sections/CTA',
  component: Cta,
  args: {
    title: 'Запустите проект быстрее',
    description: 'Соберите страницу блоками и экспортируйте в инфраструктуру Bitrix.',
    buttonText: 'Начать'
  }
} satisfies Meta<typeof Cta>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
