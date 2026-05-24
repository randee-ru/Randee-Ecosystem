'use client'

import * as React from 'react'
import {
  BookOpen,
  Boxes,
  ChevronRight,
  Code2,
  Download,
  FolderOpen,
  Hand,
  Layers,
  MousePointer2,
  Pencil,
  Plus,
  Save,
  SquarePlus,
  X
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  GuideBuilderLayoutVisual,
  GuideSectionVisual,
  type GuideVisualId,
  type InstructionsTheme
} from './builder-instructions-visuals'

export type { InstructionsTheme }

type BuilderInstructionsProps = {
  t: InstructionsTheme
  onClose: () => void
}

type GuideSection = {
  id: string
  icon: LucideIcon
  title: string
  subtitle: string
  visual?: GuideVisualId | GuideVisualId[]
  steps?: string[]
  flow?: string[]
  example?: string
  tips?: string[]
  cards?: Array<{ label: string; detail: string }>
}

const SECTIONS: GuideSection[] = [
  {
    id: 'element-builder',
    icon: MousePointer2,
    title: 'Для верстальщика элементов',
    subtitle: 'Ваш сценарий: собрать UI внутри component — кнопки, формы, карточки — без сборки всей страницы.',
    visual: ['element-workflow', 'insert-compare', 'element-canvas', 'element-gallery'],
    flow: ['New → Component', 'Edit Component ON', 'UI Elements → Button / Form…', 'Inspector → props', 'preview.tsx + CSS при необходимости'],
    steps: [
      'Вам не нужны Hero/FAQ, если вы верстаете **примитивы**. Создайте **New → Component** — это ваш «холст».',
      'Включите **Edit Component** — без этого Insert покажет Page blocks, а не UI Elements.',
      'Добавляйте элементы: **Insert** или **Assets → UI Elements** (Button, Input, Modal, Card, Tabs…).',
      'Клик по элементу на canvas → **Inspector справа**: label, placeholder, title, variant — без лезания в код.',
      'Нужна точная вёрстка? Откройте **preview.tsx** в Blocks и допишите разметку; **style.css** — стили. **Tab** в preview — Emmet (`.row`, `div.card>h2+p`).',
      '**Artboard** в Inspector — ширина/высота и фон области превью, чтобы видеть компонент как в макете.',
      'Готово → **Save to Assets**: компонент можно вставить на любую страницу и отдать в Bitrix.'
    ],
    cards: [
      { label: 'Визуально (UI Elements)', detail: 'Быстро: кнопка, поле, модалка. Props в Inspector. ~17 элементов с live preview.' },
      { label: 'Кодом (preview.tsx)', detail: 'Полный контроль: сетка, кастомные классы, Emmet, любая разметка.' },
      { label: 'Оба пути вместе', detail: 'Сначала элементы на canvas, потом доработка в preview.tsx и style.css.' },
      { label: 'Не путать', detail: 'Page blocks = секции сайта. UI Elements = детали внутри вашего component.' }
    ],
    example: `# Типичный день верстальщика элементов:

1. Edit Component ON
2. Insert → Card, затем → Button внутри (или в preview.tsx)
3. Inspector: title карточки, label кнопки
4. style.css: .my-card { padding: 1rem; }
5. Save (⌘S) → canvas обновился
6. Save to Assets → компонент в библиотеке`
  },
  {
    id: 'ide',
    icon: FolderOpen,
    title: 'Верстка в IDE (локально на компьютере)',
    subtitle: 'Если вы хотите верстать “как обычно” в VS Code/WebStorm: правите файлы в репозитории и сразу видите результат в Builder.',
    visual: ['ide-tree', 'emmet'],
    flow: ['npm install', 'npm run dev', 'Открыть /builder', 'Править preview.tsx / style.css', 'Обновить превью'],
    steps: [
      'Откройте папку проекта Randee Ecosystem в IDE (VS Code, WebStorm, Cursor).',
      'Установите зависимости и запустите dev: **npm install**, затем **npm run dev**.',
      'Откройте Builder в браузере: `http://localhost:3000/builder`.',
      'Файлы компонентов находятся в `packages/blocks/src/templates/component/component-XX/`.',
      'Для верстки: правьте `preview.tsx` (разметка), `style.css` (стили), `script.js` (поведение).',
      'После сохранения файла в IDE обновите превью: обычно хватает обычного refresh. Если упрётся в кэш — сделайте hard reload (⌘⇧R).'
    ],
    cards: [
      { label: 'Где лежит компонент', detail: 'packages/blocks/src/templates/component/component-XX/' },
      { label: 'Разметка', detail: 'preview.tsx (JSX/TSX). Emmet: `.card>h2+p` → Tab.' },
      { label: 'Стили', detail: 'style.css подключается в превью автоматически.' },
      { label: 'Создать новый', detail: 'Можно через UI: New → Component (появится новый component-XX на диске).' }
    ],
    tips: [
      'Мы поставили `Cache-Control: no-store` в dev для `/api/block-assets/*`, чтобы правки из IDE не “залипали” из-за кеша.',
      'Если хотите, я добавлю отдельную кнопку “Reload preview” для перезагрузки стилей без refresh страницы.'
    ],
    example: `# Быстрый пример:\n\n1) Откройте файл:\npackages/blocks/src/templates/component/component-01/preview.tsx\n\n2) Замените разметку:\nexport function Component01Preview({ block }) {\n  return (\n    <TemplateFrame block={block} className=\"randee-component-01\">\n      <div className=\"card\">\n        <h2>{block.props.title}</h2>\n        <p>Сверстано в IDE</p>\n      </div>\n    </TemplateFrame>\n  )\n}\n\n3) style.css:\n.card { padding: 24px; border: 1px solid #eee; border-radius: 12px; }\n\n4) Обновите /builder — увидите изменения.`
  },
  {
    id: 'start',
    icon: BookOpen,
    title: 'Быстрый старт',
    subtitle: 'Пять минут — и вы уже собрали первую страницу.',
    visual: ['layout', 'page-block'],
    flow: ['Insert → Hero', 'Клик по блоку', 'Inspector → текст', 'Save страницы', 'Export Bitrix'],
    steps: [
      'Откройте Builder: `/builder` или `/builder?slug=имя-страницы`.',
      'Через **Insert** добавьте готовый блок (Hero, FAQ, Features).',
      'Выберите блок на canvas — справа в **Inspector** меняйте заголовки и тексты.',
      'Страница сохраняется автоматически; статус **Saved** виден в шапке.',
      'Когда готово — **Export Bitrix** скачает zip для Bitrix.'
    ]
  },
  {
    id: 'page-blocks',
    icon: Plus,
    title: 'Блоки страницы',
    subtitle: 'Готовые секции сайта — не путать с UI Elements внутри компонента.',
    visual: ['page-block', 'insert-compare'],
    cards: [
      { label: 'Insert → Page blocks', detail: 'Hero, FAQ, Features и другие шаблоны из библиотеки.' },
      { label: 'Canvas', detail: 'Клик — выбор блока. ПКМ / long-press — меню: дублировать, удалить, порядок.' },
      { label: 'Blocks (слева)', detail: 'Дерево всех блоков страницы, переименование, открытие кода.' },
      { label: 'Inspector (справа)', detail: 'Поля props: заголовок, описание и др. — без правки кода.' }
    ],
    tips: [
      'Перетаскивание в дереве Blocks меняет порядок на странице (работает и на iPad).',
      'Дублируйте блок через контекстное меню, если нужна копия секции.'
    ]
  },
  {
    id: 'component',
    icon: SquarePlus,
    title: 'Свой компонент',
    subtitle: 'Пустой блок с файлами preview, style и script — ваша мини-библиотека.',
    visual: 'ide-tree',
    flow: ['New → Component', 'Edit Component', 'Insert / Assets → UI Elements', 'Save to Assets'],
    steps: [
      '**New → Component** — создаёт `component-XX` на диске и ставит блок на canvas.',
      'В панели **Blocks** откройте **preview.tsx**, **style.css**, **script.js** — полноэкранный редактор.',
      'После правок нажмите **Save** (⌘S). Превью на canvas обновится.',
      '**Save to Assets** — компонент попадёт в библиотеку; его можно вставлять на другие страницы и экспортировать в Bitrix.'
    ],
    example: `// preview.tsx — разметка компонента
export default function Preview({ title = 'Hello' }) {
  return (
    <section className="my-component">
      <h2>{title}</h2>
    </section>
  )
}`
  },
  {
    id: 'edit-component',
    icon: Pencil,
    title: 'Edit Component и UI Elements',
    subtitle: 'Сборка интерфейса из кнопок, форм, модалок — только в режиме редактирования.',
    visual: ['insert-compare', 'element-canvas', 'element-gallery'],
    steps: [
      'На странице должен быть блок типа **component**.',
      'Включите **Edit Component** в верхней панели — подсветится artboard и элементы.',
      '**Insert** (в этом режиме) показывает **UI Elements** — Button, Modal, Form и др.',
      'То же в **Assets → UI Elements**, если открыта левая панель.',
      'Клик по элементу на canvas — свойства справа в Inspector (текст кнопки, заголовок модалки…).',
      '**Artboard** — размер и фон «холста» компонента (layout / fill в Inspector).'
    ],
    tips: [
      'Без Edit Component в Insert видны только **Page blocks** (Hero, FAQ…).',
      'UI Elements — примитивы для сборки component, а не целые секции страницы.'
    ]
  },
  {
    id: 'code-emmet',
    icon: Code2,
    title: 'Редактор кода и Emmet',
    subtitle: 'Быстрая вёрстка в preview.tsx и стилях через сокращения.',
    visual: 'emmet',
    cards: [
      { label: 'preview.tsx', detail: 'Tab — развернуть Emmet. `.card` → `<div className="card"></div>`' },
      { label: 'style.css', detail: 'Emmet для CSS: `m10` → margin, `df` → display:flex' },
      { label: '⌘E', detail: 'Развернуть аббревиатуру вручную, если Tab не сработал.' },
      { label: '⌘F', detail: 'Поиск в файле. ⌘S — сохранить.' }
    ],
    example: `# В preview.tsx на строке JSX:
.card>h2{Заголовок}+p{Текст}
# Нажмите Tab → готовая разметка с className`
  },
  {
    id: 'panels',
    icon: Layers,
    title: 'Панели Builder',
    subtitle: 'Где что искать — схема интерфейса.',
    visual: 'layout',
    cards: [
      { label: 'Blocks', detail: 'Структура страницы, код файлов, reorder, export block.' },
      { label: 'Assets', detail: 'Сохранённые компоненты, UI Elements (в Edit Component), vendor CSS/JS.' },
      { label: 'Pages', detail: 'Список страниц (при подключённом API).' },
      { label: 'Inspector', detail: 'Props блока, props элемента, design artboard.' }
    ],
    tips: [
      'Тяните край панели — меняется ширина. Скрыть/показать — иконки у краёв canvas.',
      'Инструмент **Pan (H)** — двигать canvas; **Select (V)** — выбирать блоки.'
    ]
  },
  {
    id: 'save-export',
    icon: Download,
    title: 'Сохранение и экспорт',
    subtitle: 'Страница, блок и выгрузка в Bitrix.',
    visual: 'export',
    steps: [
      '**Автосохранение** — JSON страницы на сервер по slug (`?slug=demo`).',
      '**JSON / HTML** — кнопки в шапке справа: скачать текущую страницу.',
      '**Export Bitrix** — zip с `local/components/randee/…`; custom component нужно предварительно **Save to Assets**.',
      '**Export block** — в меню Blocks для одного блока (JSON + mini Bitrix).',
      '**Duplicate component** — копия шаблона `component-XX` в Assets.'
    ]
  },
  {
    id: 'touch',
    icon: Hand,
    title: 'iPad и touch',
    subtitle: 'Жесты на планшете без мыши.',
    visual: 'touch',
    cards: [
      { label: 'Pinch', detail: 'Масштаб canvas (как в браузере).' },
      { label: 'Два пальца', detail: 'Панорама canvas в режиме Pan.' },
      { label: 'Long press', detail: 'Контекстное меню блока (дублировать, удалить…).' },
      { label: 'DnD в Blocks', detail: 'Перетаскивание для смены порядка — без HTML5 drag.' }
    ]
  }
]

function renderBoldText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold" style={{ color: 'inherit' }}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <React.Fragment key={index}>{part}</React.Fragment>
  })
}

function Chip({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}33` }}
    >
      {children}
    </span>
  )
}

function FlowRow({ items, t }: { items: string[]; t: InstructionsTheme }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item, index) => (
        <React.Fragment key={item}>
          <span
            className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
            style={{ background: t.inputBg, color: t.text, border: `1px solid ${t.divider}` }}
          >
            {item}
          </span>
          {index < items.length - 1 ? (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  )
}

function SectionCard({
  section,
  t,
  index
}: {
  section: GuideSection
  t: InstructionsTheme
  index: number
}) {
  const Icon = section.icon

  return (
    <article
      id={`guide-${section.id}`}
      className="scroll-mt-4 rounded-xl p-4 sm:p-5"
      style={{
        background: t.panelElevated,
        border: `1px solid ${t.divider}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}
    >
      <div className="mb-3 flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
          style={{ background: `${t.accent}22`, color: t.accent }}
        >
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0" style={{ color: t.accent }} />
            <h2 className="text-base font-semibold" style={{ color: t.text }}>
              {section.title}
            </h2>
          </div>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: t.textSecondary }}>
            {section.subtitle}
          </p>
        </div>
      </div>

      {section.visual ? (
        <div className="mb-4 space-y-1">
          {(Array.isArray(section.visual) ? section.visual : [section.visual]).map((visualId) => (
            <GuideSectionVisual key={visualId} visualId={visualId} t={t} />
          ))}
        </div>
      ) : null}

      {section.flow ? (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
            Сценарий
          </p>
          <FlowRow items={section.flow} t={t} />
        </div>
      ) : null}

      {section.steps ? (
        <ol className="mb-4 space-y-2 pl-0">
          {section.steps.map((step, stepIndex) => (
            <li key={stepIndex} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: t.textSecondary }}>
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                style={{ background: t.inputBg, color: t.textMuted }}
              >
                {stepIndex + 1}
              </span>
              <span>{renderBoldText(step)}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {section.cards ? (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {section.cards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg p-3"
              style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}
            >
              <p className="text-xs font-semibold" style={{ color: t.text }}>
                {card.label}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed" style={{ color: t.textMuted }}>
                {card.detail}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {section.example ? (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
            Пример
          </p>
          <pre
            className="overflow-x-auto rounded-lg p-3 text-[11px] leading-relaxed"
            style={{
              background: t.bg,
              color: t.textSecondary,
              border: `1px solid ${t.divider}`,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
            }}
          >
            {section.example}
          </pre>
        </div>
      ) : null}

      {section.tips ? (
        <div
          className="rounded-lg px-3 py-2.5"
          style={{ background: `${t.accent}0c`, border: `1px solid ${t.accent}28` }}
        >
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.accent }}>
            Совет
          </p>
          <ul className="space-y-1">
            {section.tips.map((tip) => (
              <li key={tip} className="text-[11px] leading-relaxed" style={{ color: t.textSecondary }}>
                • {tip}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  )
}

export function BuilderInstructions({ t, onClose }: BuilderInstructionsProps) {
  const [activeId, setActiveId] = React.useState(SECTIONS[0].id)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const scrollToSection = (id: string) => {
    setActiveId(id)
    document.getElementById(`guide-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  React.useEffect(() => {
    const root = scrollRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target.id) {
          setActiveId(visible.target.id.replace('guide-', ''))
        }
      },
      { root, rootMargin: '-12% 0px -55% 0px', threshold: [0, 0.25, 0.5] }
    )

    for (const section of SECTIONS) {
      const el = document.getElementById(`guide-${section.id}`)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" style={{ background: t.bg }}>
      <header
        className="flex shrink-0 items-center gap-3 px-4 py-3"
        style={{ borderBottom: `1px solid ${t.divider}`, background: t.panelElevated }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: `${t.accent}22`, color: t.accent }}
        >
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold" style={{ color: t.text }}>
            Инструкция по Builder
          </h1>
          <p className="text-[11px]" style={{ color: t.textMuted }}>
            Вёрстка, блоки, компоненты и экспорт — по шагам для новичка
          </p>
        </div>
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-md px-3 text-[11px] font-medium"
          style={{ background: t.inputBg, color: t.textSecondary, border: `1px solid ${t.divider}`, cursor: 'pointer' }}
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
          Закрыть
        </button>
      </header>

      <div className="shrink-0 px-4 py-3" style={{ borderBottom: `1px solid ${t.divider}`, background: t.panel }}>
        <div className="flex flex-wrap gap-2">
          <Chip accent={t.accent}>
            <MousePointer2 className="mr-1 inline h-3 w-3" />
            Insert — блоки
          </Chip>
          <Chip accent={t.accent}>
            <Pencil className="mr-1 inline h-3 w-3" />
            Edit Component
          </Chip>
          <Chip accent={t.accent}>
            <Save className="mr-1 inline h-3 w-3" />
            Автосохранение
          </Chip>
          <Chip accent={t.accent}>
            <Boxes className="mr-1 inline h-3 w-3" />
            Export Bitrix
          </Chip>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <nav
          className="hidden h-full w-52 shrink-0 overflow-y-auto overscroll-y-contain p-3 lg:block"
          style={{ borderRight: `1px solid ${t.divider}`, background: t.panel }}
        >
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
            Разделы
          </p>
          <ul className="space-y-0.5">
            {SECTIONS.map((section, index) => {
              const Icon = section.icon
              const isActive = activeId === section.id
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px]"
                    style={{
                      background: isActive ? `${t.accent}18` : 'transparent',
                      color: isActive ? t.accent : t.textSecondary,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => scrollToSection(section.id)}
                  >
                    <span className="w-4 text-center font-semibold" style={{ color: t.textMuted }}>
                      {index + 1}
                    </span>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate font-medium">{section.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
            {SECTIONS.map((section, index) => (
              <button
                key={section.id}
                type="button"
                className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-medium"
                style={{
                  background: activeId === section.id ? `${t.accent}22` : t.inputBg,
                  color: activeId === section.id ? t.accent : t.textMuted,
                  border: `1px solid ${activeId === section.id ? `${t.accent}44` : t.divider}`,
                  cursor: 'pointer'
                }}
                onClick={() => scrollToSection(section.id)}
              >
                {index + 1}. {section.title}
              </button>
            ))}
          </div>

          <div
            className="mb-6 rounded-2xl p-5 sm:p-6"
            style={{
              background: `linear-gradient(135deg, ${t.accent}22 0%, ${t.panelElevated} 48%, ${t.panel} 100%)`,
              border: `1px solid ${t.accent}33`
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: t.accent }}>
              Randee Builder
            </p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl" style={{ color: t.text }}>
              Соберите страницу без IDE
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: t.textSecondary }}>
              Готовые секции (Hero, FAQ) — через <strong>Insert</strong>. Свои блоки — через{' '}
              <strong>New → Component</strong> и редактор кода. Кнопки и формы внутри компонента — через{' '}
              <strong>Edit Component</strong> и каталог UI Elements.{' '}
              <strong>Верстальщику элементов</strong> — начните с раздела 1 в меню слева.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: FolderOpen, label: 'Blocks — структура' },
                { icon: Layers, label: 'Assets — библиотека' },
                { icon: Code2, label: 'Код + Emmet' }
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px]"
                  style={{ background: t.inputBg, color: t.textSecondary, border: `1px solid ${t.divider}` }}
                >
                  <Icon className="h-3 w-3" style={{ color: t.accent }} />
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-5">
              <GuideBuilderLayoutVisual t={t} />
            </div>
          </div>

          <div className="mx-auto flex flex-col gap-4">
            {SECTIONS.map((section, index) => (
              <SectionCard key={section.id} section={section} t={t} index={index} />
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-3xl pb-4 text-center text-[11px]" style={{ color: t.textMuted }}>
            Подробный roadmap:{' '}
            <code className="rounded px-1 py-0.5" style={{ background: t.inputBg }}>
              docs/builder/blocks-roadmap-ru.md
            </code>
            · Уроки:{' '}
            <code className="rounded px-1 py-0.5" style={{ background: t.inputBg }}>
              уроки/02-ui-и-builder.md
            </code>
          </p>
        </div>
      </div>
    </div>
  )
}
