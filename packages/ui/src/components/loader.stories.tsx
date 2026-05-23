import type { Meta, StoryObj } from '@storybook/react'
import { Loader } from './loader'

const meta = {
  title: 'UI/Loader',
  component: Loader,
  args: { label: 'Загрузка' }
} satisfies Meta<typeof Loader>

export default meta

type Story = StoryObj<typeof meta>
export const Default: Story = {}
