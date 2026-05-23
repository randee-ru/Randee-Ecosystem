import { cn } from '../lib/cn'

export interface LoaderProps {
  className?: string
  label?: string
}

export function Loader({ className, label = 'Loading' }: LoaderProps) {
  return (
    <div className={cn('inline-flex items-center gap-2 text-sm text-neutral-600', className)}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" aria-hidden />
      <span>{label}</span>
    </div>
  )
}
