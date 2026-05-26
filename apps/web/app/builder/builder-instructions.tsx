'use client'

import * as React from 'react'
import './builder-instructions.css'
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
    id: 'element-canvas',
    icon: Layers,
    title: 'Element Canvas — drag и меню',
    subtitle: 'Pointer Events вместо HTML5 drag: перетаскивание, вставка, контекстное меню и горячие клавиши.',
    visual: ['element-canvas', 'element-gallery'],
    cards: [
      { label: 'Drag', detail: 'Зажмите элемент — ghost следует за курсором, синяя линия = куда встанет.' },
      { label: 'Inside', detail: 'Container / Columns — drop inside подсвечивает фон синим.' },
      { label: 'ПКМ', detail: 'Дублировать, Переименовать, Вверх, Вниз, Удалить.' },
      { label: 'Клавиши', detail: 'Delete, ⌘D, ↑ ↓, Escape.' }
    ],
    tips: [
      'План доработок: **docs/builder/dev-roadmap-ru.md** → Спринт 8 (export elements, drop из Insert).',
      'Framer-level (resize, multi-select, rotation) — Спринт 10, пока вне scope.'
    ]
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
    id: 'cms-connection',
    icon: Boxes,
    title: 'CMS: подключение randee.connector',
    subtitle: 'Как подключить Bitrix сайт, загрузить инфоблоки и использовать их в props компонента.',
    flow: [
      'Bitrix: установить randee.connector',
      'Bitrix: скопировать API key и endpoint',
      'Builder → CMS: Site URL + API key + Connector Path',
      'Save CMS settings → Проверить подключение',
      'Обновить инфоблоки → Binding (CMS) в Inspector'
    ],
    steps: [
      'В Bitrix откройте `Настройки → Настройки модулей → Randee Connector` и заполните API key.',
      'Проверьте endpoint: `/local/modules/randee.connector/tools/connector.php`.',
      'В Builder откройте **CMS** и укажите: Site URL (`https://ваш-домен`), API key, Connector Path.',
      'Нажмите **Save CMS settings**. Статус должен стать `CMS saved status: saved`.',
      'Нажмите **Проверить подключение**. При успехе увидите `Подключено. randee.connector ...`.',
      'Нажмите **Обновить инфоблоки** — Builder загрузит список инфоблоков, schema и sample элементов.',
      'В правой панели блока выберите prop → `Binding (CMS)` и задайте Iblock, Field/Property, Element.',
      'Сохраните страницу и обновите — значения подключения и привязки должны сохраниться.'
    ],
    cards: [
      { label: 'Рабочий Connector Path', detail: '/local/modules/randee.connector/tools/connector.php' },
      { label: 'Проверка вручную', detail: 'https://site.tld/local/modules/randee.connector/tools/connector.php?action=ping&api_key=KEY&format=json' },
      { label: 'Где привязки', detail: 'Правый Inspector → Block props → Binding (CMS).' },
      { label: 'Что сохраняется', detail: 'CMS connection в JSON страницы + кеш схемы в localStorage.' }
    ],
    tips: [
      'Если после reload видите `example.com/secret key`, значит ранее была открыта пустая страница без slug. Сейчас Builder грузит `home` по умолчанию.',
      'Если `Load failed`, проверьте CORS в настройках модуля (`allowed_origins`) и HTTPS домен.',
      'После изменения API key в Bitrix нажмите Save CMS settings в Builder повторно.'
    ],
    example: `# Минимальный сценарий\n\n1) Bitrix module settings:\nAPI key = ваш ключ\nEndpoint = /local/modules/randee.connector/tools/connector.php\n\n2) Builder CMS:\nSite URL = https://example.com\nAPI key = тот же ключ\nConnector Path = /local/modules/randee.connector/tools/connector.php\n\n3) Нажмите:\nSave CMS settings → Проверить подключение → Обновить инфоблоки`
  },
  {
    id: 'cms-slider-60sec',
    icon: Boxes,
    title: 'CMS Slider за 60 секунд',
    subtitle: 'Короткий сценарий: добавить слайдер, связать с инфоблоком и увидеть результат.',
    flow: ['Assets → Components → + CMS Slider', 'CMS screen: подключение', 'Configure as Swiper announcements', 'Refresh slides now', 'Save page now'],
    steps: [
      'Откройте **Assets → Components** и нажмите **+ CMS Slider**.',
      'Откройте экран **CMS**, укажите Site URL, API key, Connector Path и нажмите **Проверить подключение**.',
      'Выберите инфоблок со слайдами и нажмите **Обновить инфоблоки**.',
      'Вернитесь к блоку слайдера, справа нажмите **Configure as Swiper announcements**.',
      'Нажмите **Refresh slides now** — слайдер перечитает данные.',
      'Зафиксируйте результат кнопкой **Save page now**.'
    ],
    cards: [
      { label: 'Если пусто', detail: 'Проверьте iblock и наличие PREVIEW_PICTURE/DETAIL_PICTURE у элементов.' },
      { label: 'Если Load failed', detail: 'Проверьте CORS (`allowed_origins`) и HTTPS URL сайта.' },
      { label: 'Если не обновилось', detail: 'Нажмите Refresh slides now и сделайте hard reload (⌘⇧R).' },
      { label: 'Где код', detail: 'Blocks → component-03 → preview.tsx / style.css / script.js.' }
    ]
  },
  {
    id: 'newbie-block-flow',
    icon: Layers,
    title: 'Новичку: блоки, props и переменные',
    subtitle: 'Быстрая схема: как добавлять блоки, какие поля менять и где живут переменные.',
    flow: ['Insert → блок', 'Клик по блоку', 'Component / CMS Slider Controls', 'Save page now', 'JSON при необходимости'],
    steps: [
      'Во вкладке **Pages** используйте кнопку **+ New page** для создания новой страницы (имя + slug).',
      'Во вкладке **Pages** рядом со страницей доступны действия: **Duplicate**, **Rename**, **Delete**.',
      'Добавление блока: нажмите **Insert** и выберите блок из списка Components.',
      'Выбор блока: кликните по блоку на canvas — справа откроется Inspector.',
      'Редактирование данных: в секции **Component** (или **CMS Slider Controls**) меняйте поля props.',
      'Что такое props: это переменные блока (`title`, `subtitle`, `cmsIblockId`, `cmsLimit` и т.д.), они влияют на preview и экспорт.',
      'Для CMS Slider: сначала откройте экран **CMS**, подключите сайт, затем в правой панели нажмите **Configure as Swiper announcements**.',
      'Сохранение: используйте кнопку **Save page now** в шапке, чтобы зафиксировать текущее состояние сразу.',
      'IDE-режим: в панели Blocks откройте `preview.tsx`, `style.css`, `script.js` и редактируйте компонент кодом.'
    ],
    cards: [
      { label: 'Где переменные', detail: 'В правой панели Inspector, секция Component/CMS Slider Controls.' },
      { label: 'Где код', detail: 'Слева в Blocks: preview.tsx, init.ts, style.css, script.js.' },
      { label: 'Быстрый safe-save', detail: 'Кнопка Save page now в верхней панели.' },
      { label: 'Проверка CMS', detail: 'Экран CMS → Проверить подключение → Обновить инфоблоки.' }
    ]
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

function guideThemeVars(t: InstructionsTheme): React.CSSProperties {
  return {
    '--guide-bg': t.bg,
    '--guide-panel': t.panel,
    '--guide-panel-elevated': t.panelElevated,
    '--guide-divider': t.divider,
    '--guide-text': t.text,
    '--guide-text-secondary': t.textSecondary,
    '--guide-text-muted': t.textMuted,
    '--guide-input-bg': t.inputBg,
    '--guide-accent': t.accent
  } as React.CSSProperties
}

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
    <article id={`guide-${section.id}`} className="randee-instructions__section">
      <div className="randee-instructions__section-head">
        <div className="randee-instructions__section-index">{index + 1}</div>
        <div className="min-w-0 flex-1">
          <div className="randee-instructions__section-title-row">
            <Icon className="h-4 w-4 shrink-0" style={{ color: t.accent }} />
            <h2 className="randee-instructions__section-title">{section.title}</h2>
          </div>
          <p className="randee-instructions__section-lead">{section.subtitle}</p>
        </div>
      </div>

      {section.visual ? (
        <div className="randee-instructions__visual-block">
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
    <div className="randee-instructions" style={guideThemeVars(t)}>
      <header className="randee-instructions__header">
        <div className="randee-instructions__header-icon">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="randee-instructions__header-body">
          <h1 className="randee-instructions__title">Инструкция по Builder</h1>
          <p className="randee-instructions__subtitle">
            Вёрстка, блоки, компоненты и экспорт — по шагам для новичка
          </p>
        </div>
        <button type="button" className="randee-instructions__close-btn" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
          Закрыть
        </button>
      </header>

      <div className="randee-instructions__chips-bar">
        <div className="randee-instructions__chips">
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

      <div className="randee-instructions__body">
        <nav className="randee-instructions__nav">
          <p className="randee-instructions__nav-label">Разделы</p>
          <ul className="randee-instructions__nav-list">
            {SECTIONS.map((section, index) => {
              const Icon = section.icon
              const isActive = activeId === section.id
              return (
                <li key={section.id} className="randee-instructions__nav-item">
                  <button
                    type="button"
                    className={
                      isActive
                        ? 'randee-instructions__nav-link randee-instructions__nav-link--active'
                        : 'randee-instructions__nav-link'
                    }
                    onClick={() => scrollToSection(section.id)}
                  >
                    <span className="randee-instructions__nav-index">{index + 1}</span>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate font-medium">{section.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div ref={scrollRef} className="randee-instructions__scroll">
          <div className="randee-instructions__content">
          <div className="randee-instructions__mobile-nav">
            {SECTIONS.map((section, index) => (
              <button
                key={section.id}
                type="button"
                className={
                  activeId === section.id
                    ? 'randee-instructions__mobile-chip randee-instructions__mobile-chip--active'
                    : 'randee-instructions__mobile-chip'
                }
                onClick={() => scrollToSection(section.id)}
              >
                {index + 1}. {section.title}
              </button>
            ))}
          </div>

          <div className="randee-instructions__hero">
            <p className="randee-instructions__hero-kicker">Randee Builder</p>
            <h2 className="randee-instructions__hero-title">Соберите страницу без IDE</h2>
            <p className="randee-instructions__hero-text">
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

          <div className="randee-instructions__sections">
            {SECTIONS.map((section, index) => (
              <SectionCard key={section.id} section={section} t={t} index={index} />
            ))}
          </div>

          <p className="randee-instructions__footer">
            План разработки:{' '}
            <code>docs/builder/dev-roadmap-ru.md</code>
            · Roadmap блоков:{' '}
            <code>docs/builder/blocks-roadmap-ru.md</code>
            · Уроки:{' '}
            <code>уроки/02-ui-и-builder.md</code>
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}
