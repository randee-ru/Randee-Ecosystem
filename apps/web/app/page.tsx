'use client'

import Link from 'next/link'
import { Button, Hero } from '@randee/ui'

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 md:px-6">
      <Hero
        title="Randee Ecosystem"
        description="Переход к Builder MVP: рабочий редактор уже доступен в приложении."
        ctaText="Открыть Builder"
      />
      <div className="flex gap-3">
        <Link href="/builder">
          <Button>Open Builder MVP</Button>
        </Link>
      </div>
    </main>
  )
}
