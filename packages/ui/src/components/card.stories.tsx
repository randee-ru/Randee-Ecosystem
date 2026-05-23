import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardContent, CardHeader, CardTitle } from './card'

const meta = {
  title: 'UI/Card',
  component: Card
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Randee UI</CardTitle>
      </CardHeader>
      <CardContent>Переиспользуемый блок контента для секций и карточек.</CardContent>
    </Card>
  )
}
