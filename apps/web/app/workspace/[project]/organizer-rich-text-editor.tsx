'use client'

import * as React from 'react'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalErrorBoundary as LexicalErrorBoundaryComponent } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { $getSelectionStyleValueForProperty, $patchStyleText } from '@lexical/selection'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  type EditorState,
  type LexicalEditor,
  type TextFormatType,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'

type OrganizerRichTextEditorProps = {
  blockId: string
  value: string
  richText?: string | null
  placeholder: string
  variant?: 'paragraph' | 'heading' | 'quote' | 'bullet' | 'todo'
  mentionTargets?: {
    pages: Array<{ id: string; title: string }>
    tasks: Array<{ id: string; title: string }>
  }
  onChange: (next: { text: string; richText: string }) => void
  onMentionInsert?: (mention: { kind: 'page' | 'task'; id: string; title: string }) => void
  onEnter: () => void
  onBackspaceEmpty: () => void
  onTab: (direction: 1 | -1) => void
  onMove: (direction: -1 | 1) => void
  onSlash: () => void
  onMentionRequest?: () => void
  onFocusChange?: (focused: boolean) => void
  contentRef?: (node: HTMLDivElement | null) => void
}

type Snapshot = {
  empty: boolean
  atStart: boolean
}

function getSelectionSnapshot(editor: LexicalEditor): Snapshot {
  let snapshot: Snapshot = { empty: true, atStart: true }

  editor.getEditorState().read(() => {
    const selection = $getSelection()
    const text = $getRoot().getTextContent()
    snapshot = {
      empty: text.trim().length === 0,
      atStart: Boolean(
        $isRangeSelection(selection) &&
          selection.isCollapsed() &&
          selection.anchor.offset === 0 &&
          selection.focus.offset === 0,
      ),
    }
  })

  return snapshot
}

function EditorStateSyncPlugin({
  value,
  richText,
}: {
  value: string
  richText?: string | null
}): null {
  const [editor] = useLexicalComposerContext()
  const initializedRef = React.useRef(false)

  React.useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    if (richText) {
      try {
        editor.setEditorState(editor.parseEditorState(richText))
        return
      } catch {
        // fall back to plain text below
      }
    }

    editor.update(() => {
      const root = $getRoot()
      root.clear()
      const paragraph = $createParagraphNode()
      if (value) {
        paragraph.append($createTextNode(value))
      }
      root.append(paragraph)
    })
  }, [editor, richText, value])

  return null
}

function KeyboardPlugin({
  onEnter,
  onBackspaceEmpty,
  onTab,
  onMove,
  onSlash,
  onMentionRequest,
}: Pick<
  OrganizerRichTextEditorProps,
  'onEnter' | 'onBackspaceEmpty' | 'onTab' | 'onMove' | 'onSlash' | 'onMentionRequest'
>): null {
  const [editor] = useLexicalComposerContext()

  React.useEffect(() => {
    return mergeRegister(
      editor.registerCommand<KeyboardEvent>(
        KEY_DOWN_COMMAND,
        (event) => {
          if (event.key === 'Tab') {
            event.preventDefault()
            onTab(event.shiftKey ? -1 : 1)
            return true
          }

          if (event.altKey && event.key === 'ArrowUp') {
            event.preventDefault()
            onMove(-1)
            return true
          }

          if (event.altKey && event.key === 'ArrowDown') {
            event.preventDefault()
            onMove(1)
            return true
          }

          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            onEnter()
            return true
          }

          if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
            const snapshot = getSelectionSnapshot(editor)
            if (snapshot.empty && snapshot.atStart) {
              event.preventDefault()
              onSlash()
              return true
            }
          }

          if (event.key === '@' && !event.metaKey && !event.ctrlKey && !event.altKey) {
            event.preventDefault()
            onMentionRequest?.()
            return true
          }

          if (event.key === 'Backspace') {
            const snapshot = getSelectionSnapshot(editor)
            if (snapshot.atStart && snapshot.empty) {
              event.preventDefault()
              onBackspaceEmpty()
              return true
            }
          }

          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [editor, onBackspaceEmpty, onEnter, onMentionRequest, onMove, onSlash, onTab])

  return null
}

const FONT_SIZE_PRESETS = [12, 14, 16, 18, 30, 32, 40, 48, 50, 60, 64] as const
const FONT_FAMILY_PRESETS = [
  { label: 'Auto', value: '' },
  { label: 'Inter', value: 'var(--font-inter)' },
  { label: 'Golos Text', value: 'var(--font-golos-text)' },
  { label: 'Roboto Serif', value: 'var(--font-roboto-serif)' },
  { label: 'IBM Plex Mono', value: 'var(--font-ibm-plex-mono)' },
] as const

function FormatButton({
  label,
  format,
}: {
  label: string
  format: TextFormatType
}): JSX.Element {
  const [editor] = useLexicalComposerContext()

  return (
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault()
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
      }}
      style={{
        padding: '4px 8px',
        borderRadius: 8,
        border: '1px solid #2A2A2A',
        background: '#151515',
        color: '#D8D8D8',
        fontSize: 11,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function FontSizeControl(): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const [value, setValue] = React.useState('')

  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          return
        }

        const currentValue = $getSelectionStyleValueForProperty(selection, 'font-size', '')
        const numericValue = Number.parseInt(currentValue, 10)
        setValue(Number.isNaN(numericValue) ? '' : String(numericValue))
      })
    })
  }, [editor])

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 8,
        border: '1px solid #2A2A2A',
        background: '#151515',
        color: '#D8D8D8',
        fontSize: 11,
      }}
    >
      <span style={{ color: '#8A8A8A' }}>Size</span>
      <select
        value={value}
        onChange={(event) => {
          const nextSize = Number.parseInt(event.target.value, 10)
          if (Number.isNaN(nextSize)) return

          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              $patchStyleText(selection, {
                'font-size': `${nextSize}px`,
              })
            }
          })
        }}
        style={{
          background: '#111111',
          color: '#E8E8E8',
          border: '1px solid #2A2A2A',
          borderRadius: 6,
          padding: '3px 6px',
          fontSize: 11,
          outline: 'none',
        }}
      >
        <option value="" disabled>
          Auto
        </option>
        {FONT_SIZE_PRESETS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  )
}

function FontFamilyControl(): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const [value, setValue] = React.useState('')

  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          return
        }

        const currentValue = $getSelectionStyleValueForProperty(selection, 'font-family', '')
        const matchedPreset = FONT_FAMILY_PRESETS.find((preset) => preset.value === currentValue)
        setValue(matchedPreset?.value ?? '')
      })
    })
  }, [editor])

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 8,
        border: '1px solid #2A2A2A',
        background: '#151515',
        color: '#D8D8D8',
        fontSize: 11,
      }}
    >
      <span style={{ color: '#8A8A8A' }}>Font</span>
      <select
        value={value}
        onChange={(event) => {
          const nextFont = event.target.value

          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              $patchStyleText(selection, {
                'font-family': nextFont || null,
              })
            }
          })
        }}
        style={{
          background: '#111111',
          color: '#E8E8E8',
          border: '1px solid #2A2A2A',
          borderRadius: 6,
          padding: '3px 6px',
          fontSize: 11,
          outline: 'none',
          maxWidth: 160,
        }}
      >
        {FONT_FAMILY_PRESETS.map((preset) => (
          <option key={preset.label} value={preset.value}>
            {preset.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function FormattingToolbar(): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      <FontFamilyControl />
      <FontSizeControl />
      <FormatButton label="B" format="bold" />
      <FormatButton label="I" format="italic" />
      <FormatButton label="U" format="underline" />
      <FormatButton label="S" format="strikethrough" />
      <FormatButton label="Code" format="code" />
      <FormatButton label="High" format="highlight" />
    </div>
  )
}

function RichTextErrorBoundary({
  children,
  onError,
}: {
  children: JSX.Element
  onError: (error: Error) => void
}): JSX.Element {
  return (
    <LexicalErrorBoundaryComponent
      onError={(error) => {
        onError(error)
      }}
    >
      {children}
    </LexicalErrorBoundaryComponent>
  )
}

function EditorContentArea({
  placeholder,
  variant,
  mentionTargets,
  mentionOpen,
  onMentionClose,
  onMentionInsert,
  onFocusChange,
  contentRef,
}: {
  placeholder: string
  variant: OrganizerRichTextEditorProps['variant']
  mentionTargets?: NonNullable<OrganizerRichTextEditorProps['mentionTargets']>
  mentionOpen: boolean
  onMentionClose: () => void
  onMentionInsert?: NonNullable<OrganizerRichTextEditorProps['onMentionInsert']>
  onFocusChange?: (focused: boolean) => void
  contentRef?: (node: HTMLDivElement | null) => void
}): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const [focused, setFocused] = React.useState(false)
  const [toolbarVisible, setToolbarVisible] = React.useState(false)
  const [mentionQuery, setMentionQuery] = React.useState('')
  const hideToolbarTimerRef = React.useRef<number | null>(null)
  const mentionSearchRef = React.useRef<HTMLInputElement | null>(null)

  const cancelHideToolbar = React.useCallback(() => {
    if (hideToolbarTimerRef.current !== null) {
      window.clearTimeout(hideToolbarTimerRef.current)
      hideToolbarTimerRef.current = null
    }
  }, [])

  const showToolbar = React.useCallback(() => {
    cancelHideToolbar()
    setToolbarVisible(true)
  }, [cancelHideToolbar])

  const scheduleHideToolbar = React.useCallback(() => {
    cancelHideToolbar()
    hideToolbarTimerRef.current = window.setTimeout(() => {
      setToolbarVisible(false)
      hideToolbarTimerRef.current = null
    }, 180)
  }, [cancelHideToolbar])

  React.useEffect(() => {
    return () => {
      cancelHideToolbar()
    }
  }, [cancelHideToolbar])

  React.useEffect(() => {
    if (!mentionOpen) return
    setMentionQuery('')
    const timer = window.setTimeout(() => {
      mentionSearchRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [mentionOpen])

  const mentionPageTargets = React.useMemo(() => {
    const query = mentionQuery.trim().toLowerCase()
    const pages = mentionTargets?.pages ?? []
    return query ? pages.filter((item) => item.title.toLowerCase().includes(query)) : pages
  }, [mentionQuery, mentionTargets?.pages])

  const mentionTaskTargets = React.useMemo(() => {
    const query = mentionQuery.trim().toLowerCase()
    const tasks = mentionTargets?.tasks ?? []
    return query ? tasks.filter((item) => item.title.toLowerCase().includes(query)) : tasks
  }, [mentionQuery, mentionTargets?.tasks])

  const insertMention = React.useCallback((target: { kind: 'page' | 'task'; id: string; title: string }) => {
    const label = `${target.kind === 'page' ? '@page' : '@task'} ${target.title}`
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      const mentionNode = $createTextNode(label)
      mentionNode.setStyle(
        'background-color: rgba(74, 158, 255, 0.16); color: #7CC0FF; border-radius: 999px; padding: 1px 6px; font-weight: 700;',
      )
      mentionNode.setMode('token')
      selection.insertNodes([mentionNode])
      selection.insertText(' ')
    })

    onMentionInsert?.(target)
    onMentionClose()
  }, [editor, onMentionClose, onMentionInsert])

  const baseStyle: React.CSSProperties = {
    width: '100%',
    minHeight: variant === 'quote' ? 72 : 52,
    outline: 'none',
    color: '#E8E8E8',
    fontFamily: 'inherit',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }

  const variantStyle: React.CSSProperties =
    variant === 'heading'
      ? {
          fontSize: 22,
          fontWeight: 900,
          lineHeight: 1.2,
        }
      : variant === 'quote'
        ? {
            fontSize: 14,
            lineHeight: 1.75,
            padding: '12px 14px',
            background: '#111111',
            border: '1px solid #242424',
            borderLeft: '3px solid #4A9EFF',
            borderRadius: 12,
          }
        : variant === 'bullet'
          ? {
              fontSize: 14,
              lineHeight: 1.75,
              paddingLeft: 18,
              position: 'relative',
            }
          : variant === 'todo'
            ? {
                fontSize: 14,
                lineHeight: 1.7,
              }
            : {
                fontSize: 14,
                lineHeight: 1.75,
              }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {(toolbarVisible || mentionOpen) && (
        <div
          onPointerDownCapture={showToolbar}
          onFocusCapture={showToolbar}
          style={{ marginBottom: 8 }}
        >
          {toolbarVisible && <FormattingToolbar />}
          {mentionOpen && (
            <div
              style={{
                marginBottom: toolbarVisible ? 8 : 0,
                border: '1px solid #2A2A2A',
                borderRadius: 12,
                background: '#101010',
                padding: 10,
                boxShadow: '0 18px 42px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ color: '#7CC0FF', fontSize: 11, fontWeight: 700 }}>Упоминание</span>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    onMentionClose()
                  }}
                  style={{
                    marginLeft: 'auto',
                    padding: '2px 6px',
                    borderRadius: 999,
                    border: '1px solid #2A2A2A',
                    background: '#151515',
                    color: '#D8D8D8',
                    fontSize: 10,
                    cursor: 'pointer',
                  }}
                >
                  Esc
                </button>
              </div>
              <input
                ref={mentionSearchRef}
                value={mentionQuery}
                onChange={(event) => setMentionQuery(event.target.value)}
                placeholder="Поиск страницы или задачи"
                style={{
                  width: '100%',
                  background: '#151515',
                  color: '#E8E8E8',
                  border: '1px solid #2A2A2A',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 12,
                  outline: 'none',
                  marginBottom: 10,
                }}
              />
              <div style={{ display: 'grid', gap: 10, maxHeight: 260, overflow: 'auto' }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ color: '#666', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Страницы
                  </div>
                  {mentionPageTargets.length === 0 ? (
                    <div style={{ color: '#666', fontSize: 12 }}>Ничего не найдено.</div>
                  ) : mentionPageTargets.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        insertMention({ kind: 'page', id: item.id, title: item.title })
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid #242424',
                        background: '#151515',
                        color: '#D8D8D8',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      @page {item.title}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ color: '#666', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Задачи
                  </div>
                  {mentionTaskTargets.length === 0 ? (
                    <div style={{ color: '#666', fontSize: 12 }}>Ничего не найдено.</div>
                  ) : mentionTaskTargets.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        insertMention({ kind: 'task', id: item.id, title: item.title })
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid #242424',
                        background: '#151515',
                        color: '#D8D8D8',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      @task {item.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            ref={contentRef}
            aria-placeholder={placeholder}
            placeholder={<div style={{ color: '#666', pointerEvents: 'none' }}>{placeholder}</div>}
            onFocus={() => {
              setFocused(true)
              showToolbar()
              onFocusChange?.(true)
            }}
            onBlur={() => {
              setFocused(false)
              scheduleHideToolbar()
              onFocusChange?.(false)
            }}
            style={{ ...baseStyle, ...variantStyle }}
          />
        }
        placeholder={<div style={{ color: '#666', pointerEvents: 'none' }}>{placeholder}</div>}
        ErrorBoundary={RichTextErrorBoundary}
      />
    </div>
  )
}

export function OrganizerRichTextEditor({
  blockId,
  value,
  richText,
  placeholder,
  variant = 'paragraph',
  mentionTargets,
  onChange,
  onMentionInsert,
  onEnter,
  onBackspaceEmpty,
  onTab,
  onMove,
  onSlash,
  onFocusChange,
  contentRef,
}: OrganizerRichTextEditorProps): JSX.Element {
  const [mentionOpen, setMentionOpen] = React.useState(false)
  const initialConfig = React.useMemo(
    () => ({
      namespace: `organizer-block-${blockId}`,
      onError(error: Error) {
        throw error
      },
      editorState: null,
      nodes: [HeadingNode, QuoteNode],
    }),
    [blockId],
  )

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorStateSyncPlugin value={value} richText={richText} />
      <KeyboardPlugin
        onEnter={onEnter}
        onBackspaceEmpty={onBackspaceEmpty}
        onTab={onTab}
        onMove={onMove}
        onSlash={onSlash}
        onMentionRequest={() => setMentionOpen(true)}
      />
      <OnChangePlugin
        ignoreSelectionChange
        onChange={(editorState: EditorState, _editor, _tags) => {
          let text = ''
          editorState.read(() => {
            text = $getRoot().getTextContent()
          })
          onChange({
            text,
            richText: JSON.stringify(editorState.toJSON()),
          })
        }}
      />
      <HistoryPlugin />
      <EditorContentArea
        placeholder={placeholder}
        variant={variant}
        mentionTargets={mentionTargets}
        mentionOpen={mentionOpen}
        onMentionClose={() => setMentionOpen(false)}
        onMentionInsert={onMentionInsert}
        onFocusChange={onFocusChange}
        contentRef={contentRef}
      />
    </LexicalComposer>
  )
}
