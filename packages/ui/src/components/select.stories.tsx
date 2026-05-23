import type { Meta, StoryObj } from '@storybook/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

const meta = {
  title: 'UI/Select',
  component: Select
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-64">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Выберите шаблон" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hero-01">Hero 01</SelectItem>
          <SelectItem value="hero-02">Hero 02</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
