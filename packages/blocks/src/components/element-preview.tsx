'use client'

import * as React from 'react'
import type { ComponentElement } from '@randee/builder'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  Input,
  Loader,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@randee/ui'
import { getElementVariant } from '../element-registry'

type ElementPreviewOptions = {
  selectedElementId?: string | null
  onSelectElement?: (elementId: string) => void
}

function ElementPlaceholder({ element }: { element: ComponentElement }) {
  const variant = getElementVariant(element.elementId)
  return (
    <div className="randee-element-placeholder flex min-h-[2.5rem] items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
      {element.name ?? variant?.name ?? element.elementId}
    </div>
  )
}

function renderReadyElement(element: ComponentElement) {
  const props = element.props
  const id = element.elementId

  switch (id) {
    case 'button':
      return <Button>{props.label ?? 'Button'}</Button>
    case 'input':
    case 'text-field':
      return <Input placeholder={props.placeholder ?? props.label ?? 'Input'} />
    case 'card':
      return (
        <Card>
          <CardHeader>
            <CardTitle>{props.title ?? 'Card'}</CardTitle>
          </CardHeader>
          <CardContent>{props.description ?? ''}</CardContent>
        </Card>
      )
    case 'select':
      return (
        <Select defaultValue="option-1">
          <SelectTrigger>
            <SelectValue placeholder={props.placeholder ?? 'Choose…'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option-1">Option 1</SelectItem>
            <SelectItem value="option-2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )
    case 'tabs':
      return (
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">{props.tab1 ?? 'Tab 1'}</TabsTrigger>
            <TabsTrigger value="tab2">{props.tab2 ?? 'Tab 2'}</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Tab 1 content</TabsContent>
          <TabsContent value="tab2">Tab 2 content</TabsContent>
        </Tabs>
      )
    case 'modal':
    case 'alert-dialog':
      return (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="font-medium">{props.title ?? 'Dialog'}</p>
          <p className="mt-1 text-sm text-neutral-600">{props.description ?? ''}</p>
          <Button className="mt-3" size="sm">
            Open
          </Button>
        </div>
      )
    case 'tooltip':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                Hover me
              </Button>
            </TooltipTrigger>
            <TooltipContent>{props.label ?? 'Tooltip'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    case 'table':
      return (
        <Table>
          <thead>
            <tr>
              <th>Column</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Row</td>
              <td>Data</td>
            </tr>
          </tbody>
        </Table>
      )
    case 'accordion':
      return (
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>{props.title ?? 'Section'}</AccordionTrigger>
            <AccordionContent>{props.content ?? 'Content'}</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
    case 'drawer':
    case 'popover':
      return (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm">
          {props.title ?? id} — {props.description ?? 'panel'}
        </div>
      )
    case 'dropdown':
      return (
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="outline" size="sm">
              {props.label ?? 'Menu'}
            </Button>
          </DropdownTrigger>
          <DropdownContent>
            <DropdownItem>Item 1</DropdownItem>
            <DropdownItem>Item 2</DropdownItem>
          </DropdownContent>
        </Dropdown>
      )
    case 'pagination':
      return <Pagination page={1} totalPages={5} />
    case 'breadcrumbs':
      return <Breadcrumbs items={[{ label: 'Home' }, { label: props.label ?? 'Page' }]} />
    case 'badge':
    case 'chip':
      return <Badge>{props.label ?? 'Badge'}</Badge>
    case 'alert':
      return (
        <Alert variant={(props.variant as 'info') ?? 'info'}>{props.message ?? 'Alert'}</Alert>
      )
    case 'skeleton':
      return <Skeleton className="h-12 w-full" />
    case 'loader':
    case 'spinner':
      return <Loader />
    default:
      return null
  }
}

function ElementNode({
  element,
  options
}: {
  element: ComponentElement
  options?: ElementPreviewOptions
}) {
  const variant = getElementVariant(element.elementId)
  const selected = options?.selectedElementId === element.id
  const readyNode = variant?.ready ? renderReadyElement(element) : null

  return (
    <div
      className="randee-element-node"
      data-randee-element={element.id}
      data-randee-element-type={element.elementId}
      style={{
        outline: selected ? '2px solid #7c3aed' : undefined,
        outlineOffset: 2,
        borderRadius: 6,
        cursor: options?.onSelectElement ? 'pointer' : undefined
      }}
      onClick={(event) => {
        if (!options?.onSelectElement) return
        event.stopPropagation()
        options.onSelectElement(element.id)
      }}
    >
      {readyNode ?? <ElementPlaceholder element={element} />}
    </div>
  )
}

export function ElementTreePreview({
  elements,
  options
}: {
  elements: ComponentElement[]
  options?: ElementPreviewOptions
}) {
  if (elements.length === 0) return null

  return (
    <div className="randee-element-tree flex flex-col gap-3 p-2">
      {elements.map((element) => (
        <ElementNode key={element.id} element={element} options={options} />
      ))}
    </div>
  )
}
