import type { Meta, StoryObj } from '@storybook/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'

function AccordionDemo() {
  return (
    <Accordion type="single" collapsible className="w-full max-w-lg">
      <AccordionItem value="item-1">
        <AccordionTrigger>Что такое Randee?</AccordionTrigger>
        <AccordionContent>Экосистема быстрой разработки под Bitrix.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

const meta = { title: 'UI/Accordion', component: AccordionDemo } satisfies Meta<typeof AccordionDemo>
export default meta

type Story = StoryObj<typeof meta>
export const Default: Story = {}
