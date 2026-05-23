import * as React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '../lib/cn'

export const Dropdown = DropdownMenu.Root
export const DropdownTrigger = DropdownMenu.Trigger

export function DropdownContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={sideOffset}
        className={cn('z-50 min-w-[10rem] rounded-md border border-neutral-200 bg-white p-1 shadow-md', className)}
        {...props}
      />
    </DropdownMenu.Portal>
  )
}

export function DropdownItem({ className, ...props }: React.ComponentProps<typeof DropdownMenu.Item>) {
  return <DropdownMenu.Item className={cn('cursor-default rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-neutral-100', className)} {...props} />
}
