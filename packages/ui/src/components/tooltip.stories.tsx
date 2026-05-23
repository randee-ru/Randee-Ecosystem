import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip
} satisfies Meta<typeof Tooltip>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary">Наведи на меня</Button>
        </TooltipTrigger>
        <TooltipContent>Tooltip с подсказкой</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
