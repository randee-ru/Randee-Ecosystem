import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-20">
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Randee Ecosystem</p>
        <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
          Next.js + Tailwind + shadcn/ui bootstrap
        </h1>
        <p className="max-w-2xl text-base text-neutral-600 md:text-lg">
          Базовая веб-платформа для Builder и админ-интерфейса. Следующий этап: интеграция
          canvas/editor и registry данных.
        </p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-neutral-200 p-6 md:grid-cols-[1fr_auto]">
        <Input placeholder="Название проекта" aria-label="Название проекта" />
        <Button>Создать проект</Button>
      </section>
    </main>
  )
}
