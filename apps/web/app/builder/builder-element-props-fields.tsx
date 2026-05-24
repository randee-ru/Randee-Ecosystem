'use client'

import * as React from 'react'
import type { PageBlock } from '@randee/builder'
import type { BuilderStore } from '@randee/builder'
import type { StoreApi } from 'zustand'
import { getElementPropFields } from '@randee/blocks'
import { BlockPropsFields } from './builder-block-props-fields'

type ElementPropsFieldsProps = {
  block: PageBlock
  elementId: string
  store: StoreApi<BuilderStore>
  inputStyle: React.CSSProperties
  labelColor: string
}

function renderFieldInput(
  field: { name: string; label: string; type: string; options?: string[] },
  value: string,
  onChange: (value: string) => void,
  inputStyle: React.CSSProperties
) {
  if (field.type === 'boolean') {
    return (
      <select
        style={inputStyle}
        value={value === 'true' ? 'true' : 'false'}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    )
  }

  if (field.type === 'select' && field.options?.length) {
    return (
      <select style={inputStyle} value={value} onChange={(event) => onChange(event.target.value)}>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  }

  return (
    <input
      style={inputStyle}
      type={field.type === 'number' ? 'number' : 'text'}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function ElementPropsFields({ block, elementId, store, inputStyle, labelColor }: ElementPropsFieldsProps) {
  const element = block.elements?.find((item) => item.id === elementId)
  if (!element) {
    return (
      <p className="text-xs" style={{ color: labelColor }}>
        Element not found.
      </p>
    )
  }

  const fields = getElementPropFields(element.elementId)
  if (fields.length === 0) {
    return (
      <p className="text-xs" style={{ color: labelColor }}>
        No editable props for this element.
      </p>
    )
  }

  return (
    <div className="grid gap-2">
      {fields.map((field) => {
        const value = element.props[field.name] ?? ''
        return (
          <label key={field.name} className="grid gap-1">
            <span className="text-[10px]" style={{ color: labelColor }}>
              {field.label}
            </span>
            {renderFieldInput(field, value, (next) => {
              store.getState().updateElementProps(block.id, element.id, { [field.name]: next })
            }, inputStyle)}
          </label>
        )
      })}
    </div>
  )
}

export function ComponentRootPropsFields({
  block,
  store,
  inputStyle,
  labelColor
}: Omit<ElementPropsFieldsProps, 'elementId'>) {
  return <BlockPropsFields block={block} store={store} inputStyle={inputStyle} labelColor={labelColor} />
}
