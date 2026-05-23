import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '../lib/cn'

export const Drawer = Dialog.Root
export const DrawerTrigger = Dialog.Trigger
export const DrawerClose = Dialog.Close

export function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <Dialog.Content
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-neutral-200 bg-white p-6 shadow-xl',
          className
        )}
        {...props}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}

export function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mb-4', className)} {...props} />
}

export function DrawerTitle({ className, ...props }: React.ComponentProps<typeof Dialog.Title>) {
  return <Dialog.Title className={cn('text-lg font-semibold', className)} {...props} />
}

export function DrawerDescription({ className, ...props }: React.ComponentProps<typeof Dialog.Description>) {
  return <Dialog.Description className={cn('text-sm text-neutral-600', className)} {...props} />
}
