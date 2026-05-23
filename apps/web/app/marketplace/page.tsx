'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Download,
  PackagePlus,
  Search,
  ShieldCheck,
  UploadCloud
} from 'lucide-react'
import { Button } from '@randee/ui'

const packages = [
  ['Hero Pro', 'section', 'pro', 'Готовый hero-блок с CTA, SEO props и Bitrix export contract.'],
  ['FAQ Lite', 'section', 'free', 'Аккордеон FAQ для лендингов и корпоративных страниц.'],
  ['Catalog Section', 'component', 'enterprise', 'Bitrix-ready каталог с infoblock bindings.']
]

const publishSteps = [
  ['1', 'Подготовить пакет', 'Компонент, story, тесты, metadata и версию.'],
  ['2', 'Загрузить в Marketplace', 'Пакет попадает в registry и получает license tier.'],
  ['3', 'Установить в проект', 'CLI подтягивает пакет, lockfile и snapshot для rollback.']
]

export default function MarketplacePage() {
  return (
    <main data-randee-page="marketplace" className="min-h-screen bg-[#eef2f0] px-5 py-5 text-slate-950">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(255,255,255,0.9),rgba(224,255,240,0.5),rgba(226,232,240,0.7))]" />
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/70 bg-white/75 px-5 py-4 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" className="gap-2 bg-white">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-semibold tracking-normal">Randee Marketplace</h1>
              <p className="mt-1 text-sm text-slate-600">Публикация, лицензии и установка Bitrix-ready пакетов.</p>
            </div>
          </div>
          <Link href="/builder">
            <Button className="gap-2 bg-slate-950 text-white">
              <Boxes className="h-4 w-4" />
              Open Builder
            </Button>
          </Link>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Catalog</p>
                <h2 className="mt-1 text-2xl font-semibold">Пакеты для быстрых Bitrix-сборок</h2>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                <Search className="h-4 w-4" />
                Search packages
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {packages.map(([name, category, tier, description]) => (
                <article key={name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <PackagePlus className="h-5 w-5 text-emerald-700" />
                        <h3 className="text-lg font-semibold">{name}</h3>
                      </div>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{category}</span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800">{tier}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" className="gap-2 bg-white">
                      <Download className="h-4 w-4" />
                      Install
                    </Button>
                    <Button variant="secondary" className="gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Check license
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-white/70 bg-slate-950 p-5 text-white shadow-[0_16px_50px_rgba(15,23,42,0.16)]">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-emerald-300" />
                <h2 className="text-xl font-semibold">Выгрузить пакет</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                MVP работает через CLI/API. UI показывает ожидаемый контракт, чтобы workflow был понятен до подключения реального upload storage.
              </p>
              <div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-white/5 p-5 text-center">
                <PackagePlus className="mx-auto h-8 w-8 text-emerald-300" />
                <p className="mt-3 text-sm font-medium">hero-pro.json</p>
                <p className="mt-1 text-xs text-slate-400">name, title, licenseTier, versions, downloadUrl</p>
              </div>
              <div className="mt-4 font-mono text-xs text-slate-300">
                npm run randee:marketplace:publish -- --file ./samples/marketplace/hero-pro.json
              </div>
            </section>

            <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
              <h2 className="text-xl font-semibold">Publish flow</h2>
              <div className="mt-4 space-y-3">
                {publishSteps.map(([step, title, text]) => (
                  <div key={step} className="flex gap-3 rounded-2xl bg-white p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                      {step}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                <h2 className="text-xl font-semibold">Quality gate</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Перед публикацией пакет должен пройти typecheck, unit tests, story/a11y и responsive smoke.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}
