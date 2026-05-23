import type { Meta, StoryObj } from '@storybook/react'
import { Hero } from './hero'

const meta = {
  title: 'Sections/Hero',
  component: Hero,
  args: {
    title: 'Современная разработка сайтов на Bitrix',
    description: 'Собирайте страницы на переиспользуемых компонентах и экспортируйте в Bitrix.',
    ctaText: 'Начать проект'
  }
} satisfies Meta<typeof Hero>

export default meta

type Story = StoryObj<typeof meta>

export const Left: Story = {}

export const Center: Story = {
  args: {
    align: 'center'
  }
}
