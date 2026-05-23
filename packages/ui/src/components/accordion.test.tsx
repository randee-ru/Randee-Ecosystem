import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'

describe('Accordion', () => {
  it('renders trigger text', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="1">
          <AccordionTrigger>Question</AccordionTrigger>
          <AccordionContent>Answer</AccordionContent>
        </AccordionItem>
      </Accordion>
    )
    expect(screen.getByText('Question')).toBeInTheDocument()
  })
})
