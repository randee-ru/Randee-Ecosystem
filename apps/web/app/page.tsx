'use client'

import {
  Hero,
  Features,
  Faq,
  Cta,
  Header,
  Footer,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Alert,
  Breadcrumbs,
  Pagination,
  RandeeCounter,
  RandeeMarquee,
  RandeeAnimatedSection
} from '@randee/ui'

const navLinks = [
  { id: '1', label: 'UI Kit', href: '#' },
  { id: '2', label: 'Builder', href: '#' },
  { id: '3', label: 'Marketplace', href: '#' }
]

const featureItems = [
  {
    id: '1',
    title: 'Компонентная архитектура',
    description: 'Переиспользуемые блоки с variants, stories и тестами.'
  },
  {
    id: '2',
    title: 'Bitrix-экспорт',
    description: 'Подготовка шаблонов и компонентов под local/components/randee.'
  },
  {
    id: '3',
    title: 'Builder + DX',
    description: 'Визуальная сборка страниц с упором на скорость разработки.'
  }
]

const faqItems = [
  {
    id: '1',
    question: 'Это аналог Tilda?',
    answer: 'Нет. Randee — инженерная платформа для Bitrix-разработки.'
  },
  {
    id: '2',
    question: 'Можно ли использовать только UI Kit?',
    answer: 'Да, UI Kit можно использовать независимо от Builder-модуля.'
  }
]

export default function HomePage() {
  return (
    <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f7f7f7_60%,#ffffff_100%)]">
      <Header brand="Randee" links={navLinks} ctaText="Войти" />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6 md:py-12">
        <Breadcrumbs
          items={[
            { label: 'Randee', href: '#' },
            { label: 'Phase 1', href: '#' },
            { label: 'UI Showcase' }
          ]}
        />

        <Hero
          title="Randee UI Showcase"
          description="Живая страница-полигон, где apps/web использует компоненты из packages/ui напрямую."
          ctaText="Запустить Builder"
        />

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="text-sm text-neutral-500">UI Components</div>
            <div className="mt-2 text-3xl font-semibold">
              <RandeeCounter from={0} to={24} enabled={false} />
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="text-sm text-neutral-500">Sections</div>
            <div className="mt-2 text-3xl font-semibold">
              <RandeeCounter from={0} to={6} enabled={false} />
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="text-sm text-neutral-500">Animation Primitives</div>
            <div className="mt-2 text-3xl font-semibold">
              <RandeeCounter from={0} to={6} enabled={false} />
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="text-sm text-neutral-500">Visual Tests</div>
            <div className="mt-2 text-3xl font-semibold">
              <RandeeCounter from={0} to={5} enabled={false} />
            </div>
          </div>
        </section>

        <RandeeMarquee
          enabled={false}
          items={['Bitrix', 'Tailwind-first', 'Builder', 'Marketplace', 'Cloud', 'DX']}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3"
        />

        <Features title="Что уже готово" items={featureItems} />

        <RandeeAnimatedSection
          enabled={false}
          title="Системный прогресс"
          description="Phase 1 идёт как инженерный фундамент: компоненты, секции, тесты, visual regression и анимационный слой."
        />

        <section className="grid gap-6 rounded-2xl border border-neutral-200 bg-white p-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">UI Controls</h3>
            <Input aria-label="Project name" placeholder="Название проекта" />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Выберите шаблон" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="landing">Landing</SelectItem>
                <SelectItem value="catalog">Catalog</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              <Badge>New</Badge>
              <Badge variant="success">Ready</Badge>
            </div>
            <div className="flex gap-2">
              <Button>Создать</Button>
              <Button variant="outline">Черновик</Button>
            </div>
          </div>

          <div className="space-y-4">
            <Tabs defaultValue="status">
              <TabsList>
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              </TabsList>
              <TabsContent value="status">
                <Alert variant="success" title="Готово">
                  UI primitives, sections и visual regression уже внедрены.
                </Alert>
              </TabsContent>
              <TabsContent value="roadmap">
                <Alert title="Следующий этап">Переход к Bitrix Integration (Phase 2).</Alert>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <Faq title="FAQ" items={faqItems} />
        <Cta
          title="Продолжаем к Phase 2"
          description="Следующий фокус: генератор Bitrix-компонентов, template engine и export map."
          buttonText="Перейти к интеграции"
        />

        <Pagination page={1} totalPages={4} />
      </main>

      <Footer
        brand="Randee"
        description="Модульная экосистема разработки под 1С-Битрикс."
        links={[
          { id: '1', label: 'Документация', href: '#' },
          { id: '2', label: 'GitHub', href: '#' },
          { id: '3', label: 'Roadmap', href: '#' }
        ]}
      />
    </div>
  )
}
