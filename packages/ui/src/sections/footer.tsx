import { cn } from '../lib/cn'

export interface FooterLink {
  id: string
  label: string
  href: string
}

export interface FooterProps {
  brand: string
  description: string
  links: FooterLink[]
  className?: string
}

export function Footer({ brand, description, links, className }: FooterProps) {
  return (
    <footer className={cn('border-t border-neutral-200 bg-white', className)}>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-2 md:px-6">
        <div>
          <h2 className="text-base font-semibold">{brand}</h2>
          <p className="mt-2 text-sm text-neutral-600">{description}</p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-4 md:justify-end">
          {links.map((link) => (
            <a key={link.id} href={link.href} className="text-sm text-neutral-700 hover:text-neutral-900">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
