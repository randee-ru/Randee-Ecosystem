'use client'

import * as React from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { css } from '@codemirror/lang-css'
import { xml } from '@codemirror/lang-xml'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { bracketMatching, foldGutter, foldKeymap, indentOnInput } from '@codemirror/language'
import { lintKeymap } from '@codemirror/lint'
import {
  closeSearchPanel,
  highlightSelectionMatches,
  openSearchPanel,
  search,
  searchKeymap,
  searchPanelOpen
} from '@codemirror/search'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import {
  abbreviationTracker,
  balanceInward,
  balanceOutward,
  emmetConfig,
  enterAbbreviationMode,
  expandAbbreviation,
  EmmetKnownSyntax,
  splitJoinTag,
  toggleComment,
  wrapWithAbbreviation
} from '@emmetio/codemirror6-plugin'
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode'
import { ChevronRight, FileCode2, FolderPlus, Loader2, Save, X } from 'lucide-react'
import type { BuilderAssetTarget } from './builder-asset-types'
import { openTemplateAssetInIde } from './builder-ide'

type EditorTheme = {
  bg: string
  panelElevated: string
  divider: string
  text: string
  textSecondary: string
  textMuted: string
  accent: string
  inputBg: string
}

type BuilderAssetEditorProps = {
  asset: BuilderAssetTarget
  pageName: string
  uiTheme: 'light' | 'dark'
  t: EditorTheme
  onClose: () => void
  canSaveToAssets?: boolean
  savedToAssets?: boolean
  savingToAssets?: boolean
  onSaveToAssets?: () => void
  onAssetSaved?: (asset: BuilderAssetTarget) => void
}

function languageExtension(asset: BuilderAssetTarget) {
  const path = asset.path.toLowerCase()
  if (asset.kind === 'style') return css()
  if (path.endsWith('.svg')) return xml()
  if (path.endsWith('.tsx')) return javascript({ jsx: true, typescript: true })
  if (path.endsWith('.ts')) return javascript({ jsx: false, typescript: true })
  return javascript({ jsx: false, typescript: false })
}

const EDITOR_FONT_DEFAULT = 13
const EDITOR_FONT_MIN = 10
const EDITOR_FONT_MAX = 24

function clampEditorFontSize(value: number) {
  return Math.min(EDITOR_FONT_MAX, Math.max(EDITOR_FONT_MIN, Math.round(value)))
}

function isEditorZoomKey(event: KeyboardEvent) {
  if (!event.metaKey && !event.ctrlKey) return false
  return event.key === '=' || event.key === '+' || event.key === '-' || event.key === '0'
}

function isEditorFindKey(event: KeyboardEvent) {
  return (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f'
}

function emmetSyntaxForAsset(asset: BuilderAssetTarget): EmmetKnownSyntax | null {
  const path = asset.path.toLowerCase()
  if (asset.kind === 'style') return EmmetKnownSyntax.css
  if (path.endsWith('.tsx') || path.endsWith('.jsx')) return EmmetKnownSyntax.jsx
  if (path.endsWith('.svg')) return EmmetKnownSyntax.html
  return null
}

function emmetExtensions(asset: BuilderAssetTarget) {
  const syntax = emmetSyntaxForAsset(asset)
  if (!syntax) return []

  return [
    emmetConfig.of({
      syntax,
      mark: true,
      previewEnabled: ['markup', 'stylesheet']
    }),
    abbreviationTracker({ syntax }),
    wrapWithAbbreviation('Mod-Alt-w'),
    keymap.of([
      {
        key: 'Tab',
        run: (view) => expandAbbreviation(view) || (indentWithTab.run?.(view) ?? false)
      },
      { key: 'Mod-e', run: expandAbbreviation },
      { key: 'Mod-Shift-a', run: enterAbbreviationMode },
      { key: 'Mod-Alt-/', run: toggleComment },
      { key: 'Mod-Alt-j', run: splitJoinTag },
      { key: 'Mod-Alt-b', run: balanceOutward },
      { key: 'Mod-Alt-n', run: balanceInward }
    ])
  ]
}

function editorTheme(uiTheme: 'light' | 'dark') {
  return uiTheme === 'dark' ? vscodeDark : vscodeLight
}

export function BuilderAssetEditor({
  asset,
  pageName,
  uiTheme,
  t,
  onClose,
  canSaveToAssets,
  savedToAssets,
  savingToAssets,
  onSaveToAssets,
  onAssetSaved
}: BuilderAssetEditorProps) {
  const [fontSize, setFontSize] = React.useState(EDITOR_FONT_DEFAULT)
  const editorViewRef = React.useRef<EditorView | null>(null)
  const [content, setContent] = React.useState('')
  const [savedContent, setSavedContent] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isDirty = content !== savedContent

  React.useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const loadTimeout = window.setTimeout(() => controller.abort(), 15000)

    setLoading(true)
    setError(null)

    fetch(asset.url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Не удалось загрузить файл')
        return response.text()
      })
      .then((text) => {
        if (cancelled) return
        setContent(text)
        setSavedContent(text)
      })
      .catch((loadError) => {
        if (cancelled) return
        if (loadError instanceof Error && loadError.name === 'AbortError') {
          setError('Таймаут загрузки. Перезапустите dev-сервер и попробуйте снова.')
          return
        }
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить файл')
      })
      .finally(() => {
        window.clearTimeout(loadTimeout)
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
      window.clearTimeout(loadTimeout)
    }
  }, [asset.templateId, asset.path, asset.url])

  const save = React.useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(asset.url, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: content
      })
      if (!response.ok) throw new Error('Не удалось сохранить файл')
      setSavedContent(content)
      onAssetSaved?.(asset)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить файл')
    } finally {
      setSaving(false)
    }
  }, [asset.url, content, asset, onAssetSaved])

  const saveRef = React.useRef(save)
  const isDirtyRef = React.useRef(isDirty)
  const savingRef = React.useRef(saving)
  saveRef.current = save
  isDirtyRef.current = isDirty
  savingRef.current = saving

  const triggerSave = React.useCallback(() => {
    if (isDirtyRef.current && !savingRef.current) void saveRef.current()
  }, [])

  const zoomEditorIn = React.useCallback(() => {
    setFontSize((value) => clampEditorFontSize(value + 1))
  }, [])

  const zoomEditorOut = React.useCallback(() => {
    setFontSize((value) => clampEditorFontSize(value - 1))
  }, [])

  const resetEditorZoom = React.useCallback(() => {
    setFontSize(EDITOR_FONT_DEFAULT)
  }, [])

  const handleEditorZoomKey = React.useCallback(
    (event: KeyboardEvent) => {
      if (!isEditorZoomKey(event)) return
      event.preventDefault()
      event.stopPropagation()
      if (event.key === '-') zoomEditorOut()
      else if (event.key === '0') resetEditorZoom()
      else zoomEditorIn()
    },
    [resetEditorZoom, zoomEditorIn, zoomEditorOut]
  )

  const openFindPanel = React.useCallback(() => {
    const view = editorViewRef.current
    if (view) openSearchPanel(view)
  }, [])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        event.stopPropagation()
        triggerSave()
      }
      if (isEditorFindKey(event)) {
        event.preventDefault()
        event.stopPropagation()
        openFindPanel()
      }
      if (isEditorZoomKey(event)) {
        handleEditorZoomKey(event)
      }
      if (event.key === 'Escape') {
        const view = editorViewRef.current
        if (view && searchPanelOpen(view.state)) {
          event.preventDefault()
          event.stopPropagation()
          closeSearchPanel(view)
          return
        }
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [handleEditorZoomKey, onClose, openFindPanel, triggerSave])

  const saveKeymap = React.useMemo(
    () =>
      keymap.of([
        {
          key: 'Mod-s',
          run: () => {
            triggerSave()
            return true
          }
        }
      ]),
    [triggerSave]
  )

  const zoomKeymap = React.useMemo(
    () =>
      keymap.of([
        {
          key: 'Mod-=',
          run: () => {
            zoomEditorIn()
            return true
          }
        },
        {
          key: 'Mod-+',
          run: () => {
            zoomEditorIn()
            return true
          }
        },
        {
          key: 'Mod--',
          run: () => {
            zoomEditorOut()
            return true
          }
        },
        {
          key: 'Mod-0',
          run: () => {
            resetEditorZoom()
            return true
          }
        }
      ]),
    [resetEditorZoom, zoomEditorIn, zoomEditorOut]
  )

  const fontSizeTheme = React.useMemo(
    () =>
      EditorView.theme({
        '&': { fontSize: `${fontSize}px` },
        '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
        '.cm-content': { fontSize: `${fontSize}px` },
        '.cm-gutters': { fontSize: `${fontSize}px` }
      }),
    [fontSize]
  )

  const searchTheme = React.useMemo(
    () =>
      EditorView.theme(
        {
          '.cm-panel.cm-search': {
            background: t.panelElevated,
            color: t.text,
            borderBottom: `1px solid ${t.divider}`,
            padding: '6px 8px',
            gap: '6px'
          },
          '.cm-panel.cm-search input, .cm-panel.cm-search button': {
            background: t.inputBg,
            color: t.text,
            border: `1px solid ${t.divider}`,
            borderRadius: '6px',
            fontSize: '12px'
          },
          '.cm-panel.cm-search label': {
            color: t.textSecondary,
            fontSize: '12px'
          },
          '.cm-searchMatch': {
            backgroundColor: `${t.accent}44`,
            outline: `1px solid ${t.accent}`
          },
          '.cm-searchMatch-selected': {
            backgroundColor: `${t.accent}88`
          }
        },
        { dark: uiTheme === 'dark' }
      ),
    [t.accent, t.divider, t.inputBg, t.panelElevated, t.text, t.textSecondary, uiTheme]
  )

  const extensions = React.useMemo(
    () => [
      lineNumbers(),
      highlightSelectionMatches(),
      search({ top: true }),
      history(),
      foldGutter(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      languageExtension(asset),
      EditorView.lineWrapping,
      fontSizeTheme,
      searchTheme,
      saveKeymap,
      zoomKeymap,
      ...emmetExtensions(asset),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap
      ])
    ],
    [asset, fontSizeTheme, saveKeymap, searchTheme, zoomKeymap]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col" style={{ background: t.bg }}>
      <div
        className="flex h-10 shrink-0 items-center gap-2 px-3"
        style={{ borderBottom: `1px solid ${t.divider}`, background: t.panelElevated }}
      >
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ background: t.inputBg, border: 'none', cursor: 'pointer', color: t.textMuted }}
          onClick={onClose}
          aria-label="Закрыть редактор"
          title="Закрыть (Esc)"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-1 text-xs" style={{ color: t.textSecondary }}>
          <FileCode2 className="h-3.5 w-3.5 shrink-0" style={{ color: t.accent }} />
          <span className="truncate">{pageName}</span>
          <ChevronRight className="h-3 w-3 shrink-0" style={{ color: t.textMuted }} />
          {asset.blockName ? (
            <>
              <span className="truncate">{asset.blockName}</span>
              <ChevronRight className="h-3 w-3 shrink-0" style={{ color: t.textMuted }} />
            </>
          ) : null}
          <span className="truncate font-medium" style={{ color: t.text }}>
            {asset.label}
          </span>
          {emmetSyntaxForAsset(asset) ? (
            <span className="hidden text-[10px] sm:inline" style={{ color: t.textMuted }} title="Emmet">
              Tab — развернуть · ⌘E
            </span>
          ) : null}
        </div>

        <button
          type="button"
          className="hidden h-7 items-center rounded-md px-2 text-[10px] font-medium sm:flex"
          style={{ background: t.inputBg, color: t.textMuted, border: `1px solid ${t.divider}`, cursor: 'pointer' }}
          title="Открыть в VS Code"
          onClick={() => void openTemplateAssetInIde(asset.templateId, asset.path, { ide: 'vscode' })}
        >
          VS Code
        </button>
        <button
          type="button"
          className="hidden h-7 items-center rounded-md px-2 text-[10px] font-medium sm:flex"
          style={{ background: t.inputBg, color: t.textMuted, border: `1px solid ${t.divider}`, cursor: 'pointer' }}
          title="Открыть в Cursor"
          onClick={() => void openTemplateAssetInIde(asset.templateId, asset.path, { ide: 'cursor' })}
        >
          Cursor
        </button>

        <button
          type="button"
          className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium"
          style={{
            background: isDirty ? t.accent : t.inputBg,
            color: isDirty ? '#fff' : t.textMuted,
            border: 'none',
            cursor: isDirty && !saving ? 'pointer' : 'default',
            opacity: saving ? 0.7 : 1
          }}
          disabled={!isDirty || saving}
          onClick={() => void save()}
          title="Сохранить (⌘S)"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Сохранить
        </button>

        {canSaveToAssets && !savedToAssets ? (
          <button
            type="button"
            className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium"
            style={{
              background: `${t.accent}22`,
              color: t.accent,
              border: `1px solid ${t.accent}55`,
              cursor: savingToAssets ? 'wait' : 'pointer',
              opacity: savingToAssets ? 0.7 : 1
            }}
            disabled={savingToAssets}
            onClick={() => onSaveToAssets?.()}
            title="Сохранить компонент в Assets"
          >
            {savingToAssets ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FolderPlus className="h-3.5 w-3.5" />
            )}
            В Assets
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="shrink-0 px-3 py-2 text-xs text-red-500" style={{ borderBottom: `1px solid ${t.divider}` }}>
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm" style={{ color: t.textMuted }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Загрузка…
          </div>
        ) : (
          <CodeMirror
            value={content}
            height="100%"
            theme={editorTheme(uiTheme)}
            extensions={extensions}
            onChange={(value) => setContent(value)}
            onCreateEditor={(view) => {
              editorViewRef.current = view
            }}
            basicSetup={false}
            className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto"
            style={{ height: '100%' }}
          />
        )}
      </div>
    </div>
  )
}
