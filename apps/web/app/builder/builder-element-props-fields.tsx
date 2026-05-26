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
        <option value="true">Да</option>
        <option value="false">Нет</option>
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

  if (field.type === 'color') {
    const hex = value ? `#${value.replace('#', '')}` : '#ffffff'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <label style={{ position: 'relative', width: 28, height: 28, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0, cursor: 'pointer' }}>
          <span style={{ display: 'block', width: '100%', height: '100%', background: hex }} />
          <input
            type="color"
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            value={hex}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
        <input
          style={{ ...inputStyle, flex: 1 }}
          type="text"
          maxLength={7}
          value={value}
          placeholder="#ffffff"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    )
  }

  if (field.type === 'image') {
    return (
      <input
        style={inputStyle}
        type="url"
        value={value}
        placeholder="https://…"
        onChange={(event) => onChange(event.target.value)}
      />
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
