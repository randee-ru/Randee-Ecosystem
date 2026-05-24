'use client'

import * as React from 'react'
import type { PageBlock } from '@randee/builder'
import type { BuilderStore } from '@randee/builder'
import type { StoreApi } from 'zustand'
import { getBlockPropFieldsForTemplate, type BlockPropField } from '@randee/blocks'

type BlockPropsFieldsProps = {
  block: PageBlock
  store: StoreApi<BuilderStore>
  inputStyle: React.CSSProperties
  labelColor: string
}

function renderFieldInput(
  field: BlockPropField,
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

export function BlockPropsFields({ block, store, inputStyle, labelColor }: BlockPropsFieldsProps) {
  const fields = getBlockPropFieldsForTemplate(block.template)

  if (fields.length === 0) {
    return (
      <p className="text-xs" style={{ color: labelColor }}>
        No editable props for this block.
      </p>
    )
  }

  return (
    <div className="grid gap-2">
      {fields.map((field) => {
        const value = block.props[field.name] ?? ''
        return (
          <label key={field.name} className="grid gap-1">
            <span className="text-[10px]" style={{ color: labelColor }}>
              {field.label}
            </span>
            {renderFieldInput(field, value, (next) => {
              store.getState().updateBlockProps(block.id, { [field.name]: next })
            }, inputStyle)}
          </label>
        )
      })}
    </div>
  )
}
