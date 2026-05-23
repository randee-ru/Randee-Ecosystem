import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '../lib/cn'

export const Modal = Dialog.Root
export const ModalTrigger = Dialog.Trigger
export const ModalClose = Dialog.Close

export function ModalPortal({ ...props }: React.ComponentProps<typeof Dialog.Portal>) {
  return <Dialog.Portal {...props} />
}

export const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...props }, ref) => {
  return <Dialog.Overlay ref={ref} className={cn('fixed inset-0 z-50 bg-black/40', className)} {...props} />
})

ModalOverlay.displayName = Dialog.Overlay.displayName

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content>
>(({ className, children, ...props }, ref) => {
  return (
    <ModalPortal>
      <ModalOverlay />
      <Dialog.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white p-6 shadow-lg',
          className
        )}
        {...props}
      >
        {children}
      </Dialog.Content>
    </ModalPortal>
  )
})

ModalContent.displayName = Dialog.Content.displayName

export function ModalHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mb-3 flex flex-col gap-1', className)} {...props} />
}

export function ModalTitle({ className, ...props }: React.ComponentProps<typeof Dialog.Title>) {
  return <Dialog.Title className={cn('text-lg font-semibold', className)} {...props} />
}

export function ModalDescription({ className, ...props }: React.ComponentProps<typeof Dialog.Description>) {
  return <Dialog.Description className={cn('text-sm text-neutral-600', className)} {...props} />
}
