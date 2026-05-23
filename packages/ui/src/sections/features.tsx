import * as React from 'react'
import { cn } from '../lib/cn'

export interface FeatureItem {
  id: string
  title: string
  description: string
}

export interface FeaturesProps {
  title: string
  items: FeatureItem[]
  className?: string
}

export function Features({ title, items, className }: FeaturesProps) {
  return (
    <section className={cn('rounded-2xl border border-neutral-200 bg-white px-6 py-12 md:px-10', className)}>
      <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-neutral-200 p-5">
            <h3 className="text-lg font-medium">{item.title}</h3>
            <p className="mt-2 text-sm text-neutral-600">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
