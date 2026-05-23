import * as React from 'react'
import { cva } from '../lib/cn'
import { cn } from '../lib/cn'

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      default: 'bg-neutral-900 text-white',
      secondary: 'bg-neutral-100 text-neutral-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-amber-100 text-amber-800'
    }
  },
  defaultVariants: { variant: 'default' }
})

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning'
}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
