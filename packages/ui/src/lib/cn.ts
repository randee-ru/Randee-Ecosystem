import { cva } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export { cva }

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
