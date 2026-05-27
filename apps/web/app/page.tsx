import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/workspace')
}

// ── Старая маркетинговая страница сохранена ниже ─────────────────────────────
// Раскомментируйте экспорт и удалите redirect выше, если захотите вернуть лендинг.

/*

'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Cloud,
  Code2,
  Download,
  LayoutDashboard,
  PackagePlus,
  ShieldCheck,
  Sparkles,
  Store
} from 'lucide-react'
import { Button } from '@randee/ui'

const workflow = [
  ['01', 'Собрать страницу', 'Выбираешь Hero, FAQ, CTA, Catalog и другие блоки вместо ручной верстки каждого экрана.'],
  ['02', 'Настроить контент', 'Меняешь props, SEO, responsive preview и проверяешь, как блоки ведут себя на разных экранах.'],
  ['03', 'Экспортировать в Bitrix', 'Получаешь JSON-схему и Bitrix-ready артефакты для генерации local/components/randee.'],
  ['04', 'Переиспользовать', 'Пакеты можно версионировать, обновлять, выкладывать в Marketplace и откатывать через Core.']
]

const files = [
  ['Builder UI', 'apps/web/app/builder/page.tsx'],
  ['Block registry', 'packages/builder/src/registry/block-registry.ts'],
  ['Builder store', 'packages/builder/src/store/builder-store.ts'],
  ['Bitrix adapter', 'packages/bitrix-adapter/src'],
  ['CLI commands', 'packages/cli/src/index.ts'],
  ['Marketplace service', 'packages/marketplace/src/service/marketplace-service.ts']
]

export default function HomePage() {
  return (
    <main data-randee-page="home" className="min-h-screen overflow-hidden bg-[#eef2f0] text-slate-950">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(255,255,255,0.9),rgba(220,255,239,0.55),rgba(226,232,240,0.7))]" />
      <div className="absolute left-1/2 top-[-240px] -z-10 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold">Randee Ecosystem</p>
            <p className="text-xs text-slate-500">Bitrix development platform</p>
          </div>
        </div>
        <nav className="hidden items-center gap-2 rounded-2xl border border-white/70 bg-white/70 p-1 shadow-sm backdrop-blur md:flex">
          <Link className="rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" href="/builder">
            Builder
          </Link>
          <Link className="rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" href="/marketplace">
            Marketplace
          </Link>
          <a className="rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" href="https://github.com/randee-ru/Randee-Ecosystem" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-5 pb-8 pt-4 lg:grid-cols-[1fr_520px]">
        <div className="flex min-h-[560px] flex-col justify-center">
          <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-sm text-emerald-800 shadow-sm backdrop-blur">
            <CheckCircle2 className="h-4 w-4" />
            Сделано для ускорения Bitrix-разработки
          </p>
          <h1 className="max-w-3xl text-[56px] font-semibold leading-[0.95] tracking-normal text-slate-950 md:text-[82px]">
            Сайт на Bitrix из блоков, а не из копипасты.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-7 text-slate-600">
            Randee связывает UI Kit, визуальный Builder, экспорт в Bitrix-компоненты,
            Marketplace пакетов и Core-обновления в один рабочий процесс.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/builder">
              <Button className="gap-2 bg-slate-950 text-white">
                Открыть Builder
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" className="gap-2 bg-white/80">
                Marketplace
                <Store className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="rounded-3xl bg-[linear-gradient(135deg,#e9f8f1,#f8fafc_42%,#dfe7de)] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                <span className="font-semibold">Builder flow</span>
              </div>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs text-white">Bitrix-ready</span>
            </div>
            <div className="mt-8 grid gap-3">
              {workflow.map(([step, title, text]) => (
                <div key={step} className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                      {step}
                    </span>
                    <h3 className="font-semibold">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-5 pb-10 md:grid-cols-4">
        {[
          [Boxes, 'Bitrix export', 'Генерация структуры компонентов и шаблонов.'],
          [PackagePlus, 'Marketplace', 'Публикация и установка блоков/шаблонов.'],
          [Cloud, 'Cloud sync', 'Preview, проекты, аудит и синхронизация.'],
          [ShieldCheck, 'Quality gates', 'Typecheck, E2E, responsive и style checks.']
        ].map(([Icon, title, text]) => (
          <div key={title as string} className="rounded-2xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur">
            <Icon className="h-5 w-5 text-emerald-700" />
            <h3 className="mt-4 font-semibold">{title as string}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-5 pb-12 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur">
          <h2 className="text-xl font-semibold">Где лежит логика</h2>
          <div className="mt-4 grid gap-2">
            {files.map(([label, path]) => (
              <div key={path} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium">{label}</span>
                <code className="max-w-[60%] truncate text-xs text-slate-500">{path}</code>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-slate-950 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-semibold">Команды проверки</h2>
          </div>
          <div className="mt-5 space-y-3 font-mono text-sm text-slate-300">
            <p>npm run dev</p>
            <p>npm run typecheck --workspace @randee/web</p>
            <p>npm run test:e2e</p>
            <p>npm run randee:hardening:check</p>
          </div>
          <a className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-950" href="https://github.com/randee-ru/Randee-Ecosystem" target="_blank" rel="noreferrer">
            Открыть репозиторий
            <Download className="h-4 w-4" />
          </a>
        </div>
      </section>
    </main>
  )
}

*/
