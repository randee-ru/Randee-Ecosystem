import * as React from 'react'
import { cn } from '../lib/cn'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange?: (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-2', className)}>
      <button className="rounded-md border px-3 py-1 text-sm disabled:opacity-50" onClick={() => onPageChange?.(page - 1)} disabled={prevDisabled}>
        Назад
      </button>
      <span className="text-sm text-neutral-600">
        {page} / {totalPages}
      </span>
      <button className="rounded-md border px-3 py-1 text-sm disabled:opacity-50" onClick={() => onPageChange?.(page + 1)} disabled={nextDisabled}>
        Вперед
      </button>
    </nav>
  )
}
