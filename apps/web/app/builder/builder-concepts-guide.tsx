'use client'

import * as React from 'react'
import { Box, Layers, LayoutTemplate, MousePointer2, Pencil } from 'lucide-react'

type Theme = {
  text: string
  textMuted: string
  textSecondary: string
  accent: string
  divider: string
  inputBg: string
}

type Variant = 'page' | 'component-edit' | 'element'

export function BuilderConceptsGuide({ t, variant }: { t: Theme; variant: Variant }) {
  if (variant === 'page') {
    return (
      <div
        className="mx-2 mb-2 rounded-lg p-2.5"
        style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>
          Два уровня
        </p>
        <div className="mt-2 grid gap-2">
          <ConceptRow
            icon={LayoutTemplate}
            color="#0099FF"
            title="Секции страницы"
            detail="Hero, FAQ, каталог — целые блоки на странице. Вкладка «Секции»."
            t={t}
          />
          <ConceptRow
            icon={Box}
            color="#A855F7"
            title="Компоненты"
            detail="Своя вёрстка: кнопки, тексты, карточки. Вкладка «Компоненты» → «Редактировать»."
            t={t}
          />
        </div>
      </div>
    )
  }

  if (variant === 'component-edit') {
    return (
      <div
        className="mx-2 mb-2 rounded-lg p-2.5"
        style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}
      >
        <p className="text-[10px] font-semibold" style={{ color: '#A855F7' }}>
          Как редактировать
        </p>
        <ol className="mt-1.5 grid gap-1 pl-3 text-[10px] leading-snug" style={{ color: t.textSecondary }}>
          <li>Клик по элементу на фиолетовом artboard</li>
          <li>Или выберите в дереве «Структура» слева</li>
          <li>Справа — вкладка «Текст и props»</li>
          <li>Двойной клик по тексту/кнопке — быстрая правка</li>
        </ol>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 text-[10px] leading-snug" style={{ color: t.textMuted, borderBottom: `1px solid ${t.divider}` }}>
      <span className="inline-flex items-center gap-1" style={{ color: t.textSecondary }}>
        <MousePointer2 className="h-3 w-3" />
        Элемент
      </span>
      {' — часть компонента (кнопка, заголовок, картинка). '}
      <span className="inline-flex items-center gap-1" style={{ color: t.textSecondary }}>
        <Pencil className="h-3 w-3" />
        Текст
      </span>
      {' во вкладке «Текст», размеры — в «Макет». '}
    </div>
  )
}

function ConceptRow({
  icon: Icon,
  color,
  title,
  detail,
  t
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  title: string
  detail: string
  t: Theme
}) {
  return (
    <div className="flex gap-2">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{ background: `${color}22`, color }}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold" style={{ color: t.text }}>
          {title}
        </p>
        <p className="text-[10px] leading-snug" style={{ color: t.textMuted }}>
          {detail}
        </p>
      </div>
    </div>
  )
}

export function BuilderStepsStrip({
  t,
  steps
}: {
  t: Theme
  steps: string[]
}) {
  return (
    <div
      className="flex flex-wrap items-center gap-1 px-2 py-1.5"
      style={{ background: t.inputBg, borderTop: `1px solid ${t.divider}` }}
    >
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          {i > 0 ? (
            <span className="text-[9px]" style={{ color: t.textMuted }}>
              →
            </span>
          ) : null}
          <span className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ background: t.divider, color: t.textSecondary }}>
            {i + 1}. {step}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}
