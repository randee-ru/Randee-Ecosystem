import type { Meta, StoryObj } from '@storybook/react'
import { Alert } from './alert'

const meta = {
  title: 'UI/Alert',
  component: Alert,
  args: { variant: 'info', title: 'Информация', children: 'Описание состояния.' }
} satisfies Meta<typeof Alert>

export default meta

type Story = StoryObj<typeof meta>
export const Default: Story = {}
