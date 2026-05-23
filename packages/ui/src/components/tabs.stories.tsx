import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

const meta = {
  title: 'UI/Tabs',
  component: Tabs
} satisfies Meta<typeof Tabs>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab-1" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="tab-1">Общее</TabsTrigger>
        <TabsTrigger value="tab-2">SEO</TabsTrigger>
      </TabsList>
      <TabsContent value="tab-1">Настройки проекта</TabsContent>
      <TabsContent value="tab-2">Мета-данные и индексация</TabsContent>
    </Tabs>
  )
}
