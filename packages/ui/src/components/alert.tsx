import * as React from 'react'
import { cva } from '../lib/cn'
import { cn } from '../lib/cn'

const alertVariants = cva('rounded-lg border p-4 text-sm', {
  variants: {
    variant: {
      info: 'border-blue-200 bg-blue-50 text-blue-900',
      success: 'border-green-200 bg-green-50 text-green-900',
      warning: 'border-amber-200 bg-amber-50 text-amber-900',
      error: 'border-red-200 bg-red-50 text-red-900'
    }
  },
  defaultVariants: {
    variant: 'info'
  }
})

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
}

export function Alert({ className, variant, title, children, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {title ? <div className="mb-1 font-semibold">{title}</div> : null}
      <div>{children}</div>
    </div>
  )
}
