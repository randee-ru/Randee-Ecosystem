import { Button } from '../components/button'
import { cn } from '../lib/cn'

export interface HeaderLink {
  id: string
  label: string
  href: string
}

export interface HeaderProps {
  brand: string
  links: HeaderLink[]
  ctaText?: string
  className?: string
}

export function Header({ brand, links, ctaText = 'Связаться', className }: HeaderProps) {
  return (
    <header className={cn('w-full border-b border-neutral-200 bg-white', className)}>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <div className="text-base font-semibold">{brand}</div>
        <nav aria-label="Main navigation" className="hidden items-center gap-5 md:flex">
          {links.map((link) => (
            <a key={link.id} href={link.href} className="text-sm text-neutral-700 hover:text-neutral-900">
              {link.label}
            </a>
          ))}
        </nav>
        <Button size="sm">{ctaText}</Button>
      </div>
    </header>
  )
}
