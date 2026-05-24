import type { BlockPropField } from './types'
import type { ElementVariant } from '@randee/builder'

/** Elements with live preview via @randee/ui */
export const UI_READY_ELEMENT_IDS = new Set([
  'accordion',
  'alert',
  'badge',
  'breadcrumbs',
  'button',
  'card',
  'drawer',
  'dropdown',
  'input',
  'loader',
  'modal',
  'pagination',
  'select',
  'skeleton',
  'table',
  'tabs',
  'text-field',
  'tooltip'
])

const ELEMENT_CATALOG: Record<string, string[]> = {
  Actions: [
    'Button',
    'ButtonGroup',
    'ToggleButton',
    'ToggleButtonGroup',
    'CloseButton',
    'Link'
  ],
  Forms: [
    'Form',
    'Fieldset',
    'Input',
    'TextField',
    'TextArea',
    'NumberField',
    'SearchField',
    'Select',
    'ComboBox',
    'Autocomplete',
    'Checkbox',
    'CheckboxGroup',
    'RadioGroup',
    'Switch',
    'InputGroup',
    'InputOTP',
    'Label',
    'Description',
    'ErrorMessage',
    'FieldError'
  ],
  Overlays: ['Modal', 'AlertDialog', 'Popover', 'Tooltip', 'Drawer', 'Dropdown'],
  Feedback: ['Alert', 'Toast', 'ProgressBar', 'ProgressCircle', 'Meter', 'Spinner', 'Skeleton'],
  Navigation: ['Breadcrumbs', 'Pagination', 'Tabs', 'Toolbar'],
  'Data Display': [
    'Accordion',
    'Disclosure',
    'DisclosureGroup',
    'Table',
    'Card',
    'Badge',
    'Chip',
    'TagGroup',
    'Avatar',
    'Typography',
    'Kbd',
    'ListBox'
  ],
  Pickers: [
    'Calendar',
    'RangeCalendar',
    'DateField',
    'DatePicker',
    'DateRangePicker',
    'TimeField',
    'ColorPicker',
    'ColorArea',
    'ColorField',
    'ColorSlider',
    'ColorSwatch',
    'ColorSwatchPicker'
  ],
  Layout: ['Separator', 'Surface', 'ScrollShadow', 'Slider']
}

function toElementId(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()
}

function defaultPropsFor(name: string): Record<string, string> {
  const id = toElementId(name)

  if (['button', 'toggle-button', 'close-button', 'link'].includes(id)) {
    return { label: name === 'Link' ? 'Learn more' : name }
  }
  if (
    ['input', 'text-field', 'text-area', 'number-field', 'search-field', 'combo-box', 'autocomplete'].includes(
      id
    )
  ) {
    return { placeholder: 'Enter text…', label: name }
  }
  if (['select', 'list-box'].includes(id)) {
    return { label: name, placeholder: 'Choose…' }
  }
  if (['checkbox', 'switch', 'radio-group'].includes(id)) {
    return { label: name }
  }
  if (['modal', 'alert-dialog', 'drawer', 'popover'].includes(id)) {
    return { title: name, description: 'Description text' }
  }
  if (id === 'alert') {
    return { message: 'Alert message', variant: 'info' }
  }
  if (['accordion', 'disclosure'].includes(id)) {
    return { title: 'Section title', content: 'Section content' }
  }
  if (id === 'card') {
    return { title: 'Card title', description: 'Card body' }
  }
  if (id === 'table') {
    return { caption: 'Table' }
  }
  if (id === 'tabs') {
    return { tab1: 'Tab 1', tab2: 'Tab 2' }
  }
  if (id === 'badge' || id === 'chip') {
    return { label: 'Label' }
  }
  if (id === 'avatar') {
    return { initials: 'AB' }
  }
  if (id === 'typography') {
    return { text: 'Typography sample' }
  }
  if (id === 'progress-bar' || id === 'progress-circle' || id === 'meter') {
    return { value: '60', label: name }
  }
  if (id === 'skeleton') {
    return { width: '100%', height: '48' }
  }
  if (['calendar', 'date-picker', 'date-field', 'time-field'].includes(id)) {
    return { label: name }
  }
  return { label: name }
}

function propsSchemaFor(name: string): BlockPropField[] {
  const props = defaultPropsFor(name)
  return Object.keys(props).map((key) => ({
    name: key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    type: key === 'variant' ? ('select' as const) : ('text' as const),
    ...(key === 'variant' ? { options: ['info', 'success', 'warning', 'error'] } : {})
  }))
}

const ELEMENT_VARIANTS: ElementVariant[] = Object.entries(ELEMENT_CATALOG).flatMap(([group, names]) =>
  names.map((name) => {
    const id = toElementId(name)
    return {
      id,
      name,
      group,
      description: `UI ${name} for component composition`,
      defaultProps: defaultPropsFor(name),
      ready: UI_READY_ELEMENT_IDS.has(id)
    }
  })
)

const variantById = new Map(ELEMENT_VARIANTS.map((item) => [item.id, item]))

export function listElementVariants(): ElementVariant[] {
  return ELEMENT_VARIANTS
}

export function listElementGroups(): string[] {
  return Object.keys(ELEMENT_CATALOG)
}

export function getElementVariant(elementId: string): ElementVariant | undefined {
  return variantById.get(elementId)
}

export function getElementPropFields(elementId: string): BlockPropField[] {
  const variant = getElementVariant(elementId)
  if (!variant) return []
  return propsSchemaFor(variant.name)
}

export function groupElementVariants(
  variants: ElementVariant[] = ELEMENT_VARIANTS
): Record<string, ElementVariant[]> {
  return variants.reduce<Record<string, ElementVariant[]>>((acc, item) => {
    acc[item.group] = [...(acc[item.group] ?? []), item]
    return acc
  }, {})
}
