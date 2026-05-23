import { cn } from '../lib/cn'

export interface FaqItem {
  id: string
  question: string
  answer: string
}

export interface FaqProps {
  title: string
  items: FaqItem[]
  className?: string
}

export function Faq({ title, items, className }: FaqProps) {
  return (
    <section className={cn('rounded-2xl border border-neutral-200 bg-white px-6 py-12 md:px-10', className)}>
      <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
      <div className="mt-8 divide-y divide-neutral-200">
        {items.map((item) => (
          <details key={item.id} className="group py-4">
            <summary className="cursor-pointer list-none text-base font-medium">{item.question}</summary>
            <p className="mt-2 text-sm text-neutral-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
