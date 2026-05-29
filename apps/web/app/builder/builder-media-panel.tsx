'use client'

import * as React from 'react'
import { CheckCircle2, Film, Image as ImageIcon, Trash2, Upload, X } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type MediaFile = {
  name: string
  url: string
  type: 'image' | 'video' | 'icon' | 'other'
  size: number
  createdAt: number
}

type UploadItem = {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  errorMsg?: string
  result?: MediaFile
}

type Tab = 'all' | 'image' | 'video' | 'icon'

type Theme = {
  panel: string
  divider: string
  text: string
  textSecondary: string
  textMuted: string
  hover: string
  inputBg: string
  accent: string
}

type Props = { t: Theme }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function shortName(name: string): string {
  return name.replace(/^[a-f0-9]{12}_/, '')
}

function uploadOneXhr(file: File, onProgress: (pct: number) => void): Promise<MediaFile> {
  return new Promise((resolve, reject) => {
    const fd = new FormData()
    fd.append('file', file)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/builder/media')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText) as { file: MediaFile }
          resolve(body.file)
        } catch {
          reject(new Error('Неверный ответ сервера'))
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText) as { error?: string }
          reject(new Error(body.error ?? `Ошибка ${xhr.status}`))
        } catch {
          reject(new Error(`Ошибка ${xhr.status}`))
        }
      }
    }
    xhr.onerror = () => reject(new Error('Сетевая ошибка'))
    xhr.send(fd)
  })
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, t, onDone }: { message: string; t: Theme; onDone: () => void }) {
  React.useEffect(() => {
    const timer = window.setTimeout(onDone, 3000)
    return () => window.clearTimeout(timer)
  }, [onDone])

  return (
    <div
      className="pointer-events-none absolute bottom-3 left-2 right-2 z-10 flex items-center gap-2 rounded-xl px-3 py-2.5 shadow-xl"
      style={{ background: '#16a34a', border: '1px solid #22c55e55' }}
    >
      <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
      <span className="text-[11px] font-semibold text-white">{message}</span>
    </div>
  )
}

// ─── Upload queue row ─────────────────────────────────────────────────────────

function UploadRow({ item, t }: { item: UploadItem; t: Theme }) {
  const pct = item.progress
  const isError = item.status === 'error'
  const isDone = item.status === 'done'

  return (
    <div
      className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5"
      style={{
        background: isError ? '#2a1010' : isDone ? '#0a2010' : t.inputBg,
        border: `1px solid ${isError ? '#ef444455' : isDone ? '#22c55e55' : t.divider}`
      }}
    >
      {/* Icon */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
        style={{ background: isError ? '#ef444422' : isDone ? '#22c55e22' : `${t.accent}22` }}
      >
        {item.file.type.startsWith('video') ? (
          <Film className="h-3.5 w-3.5" style={{ color: isError ? '#f87171' : isDone ? '#4ade80' : t.accent }} />
        ) : (
          <ImageIcon className="h-3.5 w-3.5" style={{ color: isError ? '#f87171' : isDone ? '#4ade80' : t.accent }} />
        )}
      </div>

      {/* Name + progress */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium" style={{ color: isError ? '#f87171' : isDone ? '#4ade80' : t.text }}>
          {item.file.name}
        </p>
        {isError ? (
          <p className="truncate text-[9px]" style={{ color: '#f87171' }}>{item.errorMsg}</p>
        ) : isDone ? (
          <p className="text-[9px]" style={{ color: '#4ade80' }}>Загружено · {formatSize(item.file.size)}</p>
        ) : (
          <div className="mt-1 flex items-center gap-1.5">
            {/* Progress bar */}
            <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full" style={{ background: `${t.accent}22` }}>
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{ width: `${pct}%`, background: t.accent }}
              />
            </div>
            <span className="shrink-0 text-[9px] tabular-nums" style={{ color: t.textMuted }}>
              {item.status === 'pending' ? 'Ожидание' : `${pct}%`}
            </span>
          </div>
        )}
      </div>

      {/* Size */}
      {item.status !== 'error' ? (
        <span className="shrink-0 text-[9px]" style={{ color: t.textMuted }}>
          {formatSize(item.file.size)}
        </span>
      ) : null}
    </div>
  )
}

// ─── Media card ───────────────────────────────────────────────────────────────

function MediaCard({
  file, t, copied, onCopy, onDelete, onPreview
}: {
  file: MediaFile; t: Theme; copied: boolean
  onCopy: () => void; onDelete: () => void; onPreview: () => void
}) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      className="group relative overflow-hidden rounded-lg"
      style={{
        background: t.inputBg,
        border: `1px solid ${hovered ? t.accent + '66' : t.divider}`,
        cursor: 'pointer'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onPreview}
    >
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ aspectRatio: '4/3', background: '#111' }}
      >
        {file.type === 'video' ? (
          <Film className="h-8 w-8" style={{ color: t.textMuted }} />
        ) : (
          <img src={file.url} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
        )}

        {hovered ? (
          <div
            className="absolute inset-0 flex items-end justify-between gap-1 p-1.5"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[9px] font-semibold"
              style={{ background: copied ? '#16a34a' : t.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
              onClick={onCopy}
            >
              {copied ? '✓ URL' : 'URL'}
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{ background: '#ef4444', border: 'none', cursor: 'pointer', color: '#fff' }}
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="px-1.5 py-1">
        <p className="truncate text-[9px]" style={{ color: t.textMuted }}>
          {shortName(file.name)}
        </p>
        <p className="text-[9px]" style={{ color: t.textMuted, opacity: 0.6 }}>
          {formatSize(file.size)}
        </p>
      </div>
    </div>
  )
}

// ─── Preview modal ────────────────────────────────────────────────────────────

function PreviewModal({
  file, t, copied, onCopy, onClose
}: {
  file: MediaFile; t: Theme; copied: boolean; onCopy: () => void; onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative max-h-[80vh] max-w-[80vw] overflow-hidden rounded-xl shadow-2xl"
        style={{ background: t.panel, border: `1px solid ${t.divider}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3" style={{ borderBottom: `1px solid ${t.divider}` }}>
          <span className="max-w-[280px] truncate text-[11px] font-medium" style={{ color: t.text }}>
            {shortName(file.name)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[10px] font-medium"
              style={{ background: `${t.accent}22`, color: t.accent, border: 'none', cursor: 'pointer' }}
              onClick={onCopy}
            >
              {copied ? 'Скопировано!' : 'Копировать URL'}
            </button>
            <button
              type="button"
              className="rounded-md p-1.5"
              style={{ background: t.hover, border: 'none', cursor: 'pointer', color: t.textMuted }}
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center p-4" style={{ maxHeight: 'calc(80vh - 60px)' }}>
          {file.type === 'video' ? (
            <video src={file.url} controls className="max-h-[60vh] max-w-full rounded-lg" />
          ) : (
            <img src={file.url} alt={file.name} className="max-h-[60vh] max-w-full rounded-lg object-contain" />
          )}
        </div>
        <div className="px-4 pb-3 text-[10px]" style={{ color: t.textMuted }}>
          {formatSize(file.size)} · {file.url}
        </div>
      </div>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'all',   label: 'Все'     },
  { id: 'image', label: 'Фото'    },
  { id: 'video', label: 'Видео'   },
  { id: 'icon',  label: 'Иконки'  }
]

export function BuilderMediaPanel({ t }: Props) {
  const [files, setFiles]     = React.useState<MediaFile[]>([])
  const [tab, setTab]         = React.useState<Tab>('all')
  const [queue, setQueue]     = React.useState<UploadItem[]>([])
  const [dragging, setDragging] = React.useState(false)
  const [preview, setPreview] = React.useState<MediaFile | null>(null)
  const [copied, setCopied]   = React.useState<string | null>(null)
  const [toast, setToast]     = React.useState<string | null>(null)
  const inputRef    = React.useRef<HTMLInputElement>(null)
  const dragCounter = React.useRef(0)
  const processingRef = React.useRef(false)

  const load = React.useCallback(async () => {
    try {
      const res  = await fetch('/api/builder/media')
      const data = await res.json() as { files: MediaFile[] }
      setFiles(data.files ?? [])
    } catch { /* ignore */ }
  }, [])

  React.useEffect(() => { void load() }, [load])

  // Process queue sequentially
  const processQueue = React.useCallback(async () => {
    if (processingRef.current) return
    processingRef.current = true

    while (true) {
      // Find first pending item
      let pendingItem: UploadItem | undefined
      setQueue((prev) => {
        pendingItem = prev.find((i) => i.status === 'pending')
        return prev
      })
      // Wait one tick to read state
      await new Promise<void>((r) => window.setTimeout(r, 0))

      // Re-read current queue to find pending
      let currentQueue: UploadItem[] = []
      setQueue((prev) => { currentQueue = prev; return prev })
      await new Promise<void>((r) => window.setTimeout(r, 0))

      const item = currentQueue.find((i) => i.status === 'pending')
      if (!item) break

      // Mark uploading
      setQueue((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i))

      try {
        const result = await uploadOneXhr(item.file, (pct) => {
          setQueue((prev) => prev.map((i) => i.id === item.id ? { ...i, progress: pct } : i))
        })
        setQueue((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'done', progress: 100, result } : i))
        setFiles((prev) => [result, ...prev])
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Ошибка загрузки'
        setQueue((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'error', errorMsg: msg } : i))
      }
    }

    processingRef.current = false

    // Count done items and show toast
    let doneCount = 0
    setQueue((prev) => { doneCount = prev.filter((i) => i.status === 'done').length; return prev })
    await new Promise<void>((r) => window.setTimeout(r, 0))

    setQueue((prev) => {
      const done = prev.filter((i) => i.status === 'done').length
      if (done > 0) setToast(`${done} ${done === 1 ? 'файл загружен' : done < 5 ? 'файла загружено' : 'файлов загружено'}`)
      return prev
    })

    // Collapse done items after 2s
    window.setTimeout(() => {
      setQueue((prev) => prev.filter((i) => i.status === 'error'))
    }, 2000)
  }, [])

  const enqueue = React.useCallback((fileList: FileList | File[]) => {
    const arr = Array.from(fileList)
    if (arr.length === 0) return
    const items: UploadItem[] = arr.map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      status: 'pending',
      progress: 0
    }))
    setQueue((prev) => [...prev, ...items])
    void processQueue()
  }, [processQueue])

  const remove = async (name: string) => {
    await fetch(`/api/builder/media?name=${encodeURIComponent(name)}`, { method: 'DELETE' })
    setFiles((prev) => prev.filter((f) => f.name !== name))
    if (preview?.name === name) setPreview(null)
  }

  const copyUrl = (url: string) => {
    void navigator.clipboard.writeText(url)
    setCopied(url)
    window.setTimeout(() => setCopied(null), 1500)
  }

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); dragCounter.current++; setDragging(true)
  }
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); dragCounter.current--
    if (dragCounter.current === 0) setDragging(false)
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); dragCounter.current = 0; setDragging(false)
    if (e.dataTransfer.files.length > 0) enqueue(e.dataTransfer.files)
  }

  const visible = tab === 'all' ? files : files.filter((f) => f.type === tab)
  const counts: Record<Tab, number> = {
    all:   files.length,
    image: files.filter((f) => f.type === 'image').length,
    video: files.filter((f) => f.type === 'video').length,
    icon:  files.filter((f) => f.type === 'icon').length
  }

  const hasQueue = queue.length > 0
  const activeUploads = queue.filter((i) => i.status === 'uploading').length
  const pendingCount  = queue.filter((i) => i.status === 'pending').length

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* ── Upload zone ─────────────────────────────────────────── */}
      <div className="shrink-0 px-2 pt-2">
        <button
          type="button"
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl py-3 transition-all"
          style={{
            background: dragging ? `${t.accent}22` : t.inputBg,
            border: `2px dashed ${dragging ? t.accent : activeUploads > 0 ? t.accent + '88' : t.divider}`,
            cursor: 'pointer'
          }}
          onClick={() => inputRef.current?.click()}
        >
          <Upload
            className="h-4 w-4"
            style={{ color: dragging ? t.accent : activeUploads > 0 ? t.accent : t.textMuted }}
          />
          <span className="text-[11px] font-medium" style={{ color: dragging ? t.accent : activeUploads > 0 ? t.accent : t.textSecondary }}>
            {dragging
              ? 'Отпустите файлы'
              : activeUploads > 0
              ? `Загружается ${activeUploads} ${pendingCount > 0 ? `· в очереди ${pendingCount}` : ''}…`
              : 'Загрузить или перетащить'}
          </span>
          <span className="text-[10px]" style={{ color: t.textMuted }}>
            {activeUploads > 0 ? 'JPG, PNG, GIF, WebP, SVG, MP4, WebM' : 'JPG, PNG, GIF, WebP, SVG, MP4, WebM'}
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,.svg"
          className="hidden"
          onChange={(e) => { if (e.target.files) enqueue(e.target.files); e.target.value = '' }}
        />
      </div>

      {/* ── Upload queue ────────────────────────────────────────── */}
      {hasQueue ? (
        <div className="mt-2 shrink-0 space-y-1 px-2">
          <div className="flex items-center justify-between px-0.5 pb-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>
              Очередь загрузки
            </span>
            <button
              type="button"
              className="text-[9px]"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}
              onClick={() => setQueue((prev) => prev.filter((i) => i.status !== 'done' && i.status !== 'error'))}
            >
              очистить
            </button>
          </div>
          {queue.map((item) => (
            <UploadRow key={item.id} item={item} t={t} />
          ))}
        </div>
      ) : null}

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="flex shrink-0 gap-0.5 px-2 pt-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium"
            style={{
              background: tab === id ? `${t.accent}22` : 'transparent',
              color: tab === id ? t.accent : t.textMuted,
              border: `1px solid ${tab === id ? `${t.accent}55` : 'transparent'}`,
              cursor: 'pointer'
            }}
            onClick={() => setTab(id)}
          >
            {label}
            {counts[id] > 0 ? (
              <span
                className="rounded-full px-1"
                style={{
                  background: tab === id ? `${t.accent}33` : t.inputBg,
                  color: tab === id ? t.accent : t.textMuted
                }}
              >
                {counts[id]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Grid ────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 pt-1">
        {visible.length === 0 && !hasQueue ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: t.inputBg }}>
              <ImageIcon className="h-6 w-6" style={{ color: t.textMuted }} />
            </div>
            <p className="text-[11px] font-medium" style={{ color: t.textSecondary }}>
              {tab === 'all' ? 'Нет медиафайлов' : `Нет ${tab === 'image' ? 'изображений' : tab === 'video' ? 'видео' : 'иконок'}`}
            </p>
            <p className="mt-1 text-[10px]" style={{ color: t.textMuted }}>
              Перетащите или нажмите зону выше
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {visible.map((file) => (
              <MediaCard
                key={file.name}
                file={file}
                t={t}
                copied={copied === file.url}
                onCopy={() => copyUrl(file.url)}
                onDelete={() => void remove(file.name)}
                onPreview={() => setPreview(file)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Preview modal ────────────────────────────────────────── */}
      {preview ? (
        <PreviewModal
          file={preview}
          t={t}
          copied={copied === preview.url}
          onCopy={() => copyUrl(preview.url)}
          onClose={() => setPreview(null)}
        />
      ) : null}

      {/* ── Toast ────────────────────────────────────────────────── */}
      {toast ? (
        <Toast message={toast} t={t} onDone={() => setToast(null)} />
      ) : null}
    </div>
  )
}
