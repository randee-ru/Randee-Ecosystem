import type { Meta, StoryObj } from '@storybook/react'
import { Pagination } from './pagination'

const meta = {
  title: 'UI/Pagination',
  component: Pagination,
  args: { page: 2, totalPages: 8 }
} satisfies Meta<typeof Pagination>

export default meta

type Story = StoryObj<typeof meta>
export const Default: Story = {}
