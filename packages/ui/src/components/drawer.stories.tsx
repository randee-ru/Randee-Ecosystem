import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from './drawer'

const meta = { title: 'UI/Drawer', component: Drawer } satisfies Meta<typeof Drawer>
export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Панель настроек</DrawerTitle>
          <DrawerDescription>Редактируйте параметры блока.</DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  )
}
