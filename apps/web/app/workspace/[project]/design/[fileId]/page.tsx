'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, MousePointer2, Square, Circle, Type, LayoutTemplate,
  Trash2, Copy, Layers, AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2, Plus, Minus, Image as ImageIcon, Group, Ungroup,
  Eye, EyeOff, Lock, Unlock, ChevronRight,
} from 'lucide-react'
import { useDialog } from '@/components/dialog'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Tool = 'select' | 'frame' | 'rect' | 'ellipse' | 'text'
type Handle = 'tl' | 't' | 'tr' | 'l' | 'r' | 'bl' | 'b' | 'br'
type NodeType = 'frame' | 'rect' | 'ellipse' | 'text' | 'image' | 'group'

type DesignNode = {
  id: string; type: NodeType; name: string
  x: number; y: number; w: number; h: number
  fill: string; fillOpacity: number
  strokeColor: string; strokeWidth: number
  borderRadius: number; opacity: number
  visible: boolean; locked: boolean
  parentId: string | null
  children: string[]
  // Text
  text?: string; fontSize?: number; fontWeight?: number
  fontFamily?: string; textColor?: string
  textAlign?: 'left' | 'center' | 'right'; lineHeight?: number
  // Image
  imageSrc?: string; objectFit?: 'cover' | 'contain' | 'fill'
  // Frame
  clipContent?: boolean
}

type DesignData = { nodes: Record<string, DesignNode>; nodeOrder: string[] }
type HistoryItem = DesignData

// ─── Constants ─────────────────────────────────────────────────────────────────

const HANDLE_SIZE = 8
const MIN_SIZE = 6
const HANDLE_CURSORS: Record<Handle, string> = {
  tl: 'nw-resize', t: 'n-resize', tr: 'ne-resize',
  l: 'w-resize', r: 'e-resize',
  bl: 'sw-resize', b: 's-resize', br: 'se-resize',
}
const TYPE_DEFAULTS: Record<NodeType, Partial<DesignNode>> = {
  frame:   { fill: '#FFFFFF', strokeColor: '#E5E5E5', strokeWidth: 1, clipContent: true },
  rect:    { fill: '#C4C4C4', strokeColor: 'transparent', strokeWidth: 0 },
  ellipse: { fill: '#C4C4C4', strokeColor: 'transparent', strokeWidth: 0 },
  text:    { fill: 'transparent', strokeColor: 'transparent', strokeWidth: 0, text: 'Текст', fontSize: 16, fontWeight: 400, fontFamily: 'Inter, system-ui, sans-serif', textColor: '#111111', textAlign: 'left', lineHeight: 1.4 },
  image:   { fill: '#1C1C1C', strokeColor: 'transparent', strokeWidth: 0, objectFit: 'cover' },
  group:   { fill: 'transparent', strokeColor: 'transparent', strokeWidth: 0 },
}

// ─── Utils ─────────────────────────────────────────────────────────────────────

let _seq = 0
function uid() { return `n${Date.now().toString(36)}${(++_seq).toString(36)}` }
function snap(v: number, g = 1) { return Math.round(v / g) * g }
function s2c(sx: number, sy: number, px: number, py: number, z: number) {
  return { x: (sx - px) / z, y: (sy - py) / z }
}

function makeNode(type: NodeType, x: number, y: number, w: number, h: number, idx: number): DesignNode {
  const labels: Record<NodeType, string> = { frame: 'Frame', rect: 'Rect', ellipse: 'Ellipse', text: 'Text', image: 'Image', group: 'Group' }
  return {
    id: uid(), type, name: `${labels[type]} ${idx}`,
    x: snap(x), y: snap(y), w: Math.max(snap(w), MIN_SIZE), h: Math.max(snap(h), type === 'text' ? 36 : MIN_SIZE),
    fillOpacity: 1, borderRadius: 0, opacity: 1, visible: true, locked: false,
    parentId: null, children: [],
    ...TYPE_DEFAULTS[type],
  } as DesignNode
}

function computeGroupBounds(group: DesignNode, nodes: Record<string, DesignNode>) {
  const kids = group.children.map(id => nodes[id]).filter(Boolean) as DesignNode[]
  if (!kids.length) return { x: group.x, y: group.y, w: 40, h: 40 }
  const minX = Math.min(...kids.map(n => n.x))
  const minY = Math.min(...kids.map(n => n.y))
  const maxX = Math.max(...kids.map(n => n.x + n.w))
  const maxY = Math.max(...kids.map(n => n.y + n.h))
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

function resizePatch(orig: DesignNode, handle: Handle, dx: number, dy: number): Partial<DesignNode> {
  let { x, y, w, h } = orig
  if (handle === 'tl') { x += dx; y += dy; w -= dx; h -= dy }
  else if (handle === 't')  { y += dy; h -= dy }
  else if (handle === 'tr') { y += dy; w += dx; h -= dy }
  else if (handle === 'l')  { x += dx; w -= dx }
  else if (handle === 'r')  { w += dx }
  else if (handle === 'bl') { x += dx; w -= dx; h += dy }
  else if (handle === 'b')  { h += dy }
  else if (handle === 'br') { w += dx; h += dy }
  if (w < MIN_SIZE) { if ('lt'.includes(handle[0]!)) x = orig.x + orig.w - MIN_SIZE; w = MIN_SIZE }
  if (h < MIN_SIZE) { if (handle.includes('t')) y = orig.y + orig.h - MIN_SIZE; h = MIN_SIZE }
  return { x: snap(x), y: snap(y), w: snap(w), h: snap(h) }
}

function colorToHex(c?: string) {
  if (!c || c === 'transparent') return '#ffffff'
  if (c.startsWith('#') && c.length >= 6) return c.slice(0, 7)
  return '#c4c4c4'
}

function hexToRgba(hex: string, a = 1) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  return a < 1 ? `rgba(${r},${g},${b},${a})` : hex
}

// ─── Node Visual (no positioning) ────────────────────────────────────────────

function NodeVisual({ node }: { node: DesignNode }) {
  const fill = node.fill === 'transparent' ? 'transparent' : hexToRgba(colorToHex(node.fill), node.fillOpacity)
  const stroke = node.strokeColor === 'transparent' ? 'transparent' : node.strokeColor

  if (node.type === 'image' && node.imageSrc) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={node.imageSrc} alt={node.name} draggable={false} style={{ width: '100%', height: '100%', objectFit: node.objectFit ?? 'cover', display: 'block' }} />
  }
  if (node.type === 'ellipse') {
    return <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: fill, border: `${node.strokeWidth}px solid ${stroke}`, boxSizing: 'border-box' }} />
  }
  if (node.type === 'text') {
    return (
      <div style={{ width: '100%', height: '100%', fontSize: node.fontSize, fontWeight: node.fontWeight, fontFamily: node.fontFamily, color: node.textColor, textAlign: node.textAlign, lineHeight: node.lineHeight, whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: 2, boxSizing: 'border-box' }}>
        {node.text}
      </div>
    )
  }
  // frame, rect, group
  return (
    <div style={{ width: '100%', height: '100%', background: fill, border: node.strokeWidth ? `${node.strokeWidth}px solid ${stroke}` : undefined, borderRadius: node.borderRadius, boxSizing: 'border-box', overflow: node.clipContent ? 'hidden' : 'visible' }} />
  )
}

// ─── Canvas Node (with absolute positioning) ──────────────────────────────────

interface CanvasNodeProps {
  nodeId: string
  nodes: Record<string, DesignNode>
  selectedIds: string[]
  zoom: number
  panX: number
  panY: number
  onNodeMouseDown: (id: string, e: React.MouseEvent) => void
}

function CanvasNodeRenderer({ nodeId, nodes, selectedIds, zoom, panX, panY, onNodeMouseDown }: CanvasNodeProps) {
  const node = nodes[nodeId]
  if (!node || !node.visible) return null

  if (node.type === 'group') {
    const b = computeGroupBounds(node, nodes)
    return (
      <div
        style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, opacity: node.opacity, pointerEvents: node.locked ? 'none' : 'auto' }}
        onMouseDown={e => { e.stopPropagation(); onNodeMouseDown(nodeId, e) }}
      >
        <div style={{ position: 'absolute', inset: -1, border: '1px dashed rgba(139,92,246,0.5)', pointerEvents: 'none' }} />
        {node.children.map(childId => {
          const child = nodes[childId]
          if (!child || !child.visible) return null
          return (
            <div key={childId} style={{ position: 'absolute', left: child.x - b.x, top: child.y - b.y, width: child.w, height: child.h, opacity: child.opacity }}>
              <NodeVisual node={child} />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      style={{ position: 'absolute', left: node.x, top: node.y, width: node.w, height: node.h, opacity: node.opacity, pointerEvents: node.locked ? 'none' : 'auto' }}
      onMouseDown={e => { e.stopPropagation(); onNodeMouseDown(nodeId, e) }}
    >
      <NodeVisual node={node} />
    </div>
  )
}

// ─── Layers Panel ─────────────────────────────────────────────────────────────

function LayersPanel({ data, selectedIds, onSelect, onToggleVisible, onToggleLock, onRename }: {
  data: DesignData; selectedIds: string[]
  onSelect: (id: string, multi: boolean) => void
  onToggleVisible: (id: string) => void; onToggleLock: (id: string) => void
  onRename: (id: string) => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function renderNode(id: string, depth = 0): React.ReactNode {
    const node = data.nodes[id]
    if (!node) return null
    const isSelected = selectedIds.includes(id)
    const isGroup = node.type === 'group' || node.type === 'frame'
    const isExpanded = expanded.has(id)
    const icons: Record<NodeType, React.ElementType> = { frame: LayoutTemplate, rect: Square, ellipse: Circle, text: Type, image: ImageIcon, group: Group }
    const Icon = icons[node.type]

    return (
      <React.Fragment key={id}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: `4px 8px 4px ${12 + depth * 14}px`, background: isSelected ? '#1A2A3A' : 'transparent', borderLeft: `2px solid ${isSelected ? '#0099FF' : 'transparent'}`, cursor: 'pointer', userSelect: 'none' }}
          onClick={e => onSelect(id, e.shiftKey || e.metaKey)}
          onDoubleClick={() => onRename(id)}
        >
          {isGroup && node.children.length > 0 && (
            <button type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#555', padding: 0, display: 'flex', flexShrink: 0 }}
              onClick={e => { e.stopPropagation(); setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n }) }}>
              <ChevronRight size={10} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.1s' }} />
            </button>
          )}
          {(!isGroup || !node.children.length) && <span style={{ width: 10, flexShrink: 0 }} />}
          <Icon size={11} style={{ color: isSelected ? '#4A9EFF' : node.type === 'group' ? '#8B5CF6' : '#555', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 11, color: isSelected ? '#E8E8E8' : '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
          <button type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: node.visible ? '#555' : '#333', padding: 2, display: 'flex' }}
            onClick={e => { e.stopPropagation(); onToggleVisible(id) }}>
            {node.visible ? <Eye size={10} /> : <EyeOff size={10} />}
          </button>
          <button type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: node.locked ? '#4A9EFF' : '#555', padding: 2, display: 'flex' }}
            onClick={e => { e.stopPropagation(); onToggleLock(id) }}>
            {node.locked ? <Lock size={10} /> : <Unlock size={10} />}
          </button>
        </div>
        {isGroup && isExpanded && node.children.map(childId => renderNode(childId, depth + 1))}
      </React.Fragment>
    )
  }

  const topLevel = [...data.nodeOrder].reverse()
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      {topLevel.length === 0 && <div style={{ padding: '24px 12px', color: '#444', fontSize: 11, textAlign: 'center' }}>Нет слоёв</div>}
      {topLevel.map(id => renderNode(id))}
    </div>
  )
}

// ─── Properties Panel ─────────────────────────────────────────────────────────

function PInput({ label, value, onChange, min, max, step = 1, unit = '' }: {
  label: string; value: number | string; onChange: (v: string) => void
  min?: number; max?: number; step?: number; unit?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
      <span style={{ width: 14, fontSize: 10, color: '#555', flexShrink: 0, textAlign: 'center' }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#181818', border: '1px solid #2A2A2A', borderRadius: 5 }}>
        <input type="number" value={value} min={min} max={max} step={step}
          onChange={e => onChange(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '4px 6px', fontSize: 11, color: '#E8E8E8', width: 0 }} />
        {unit && <span style={{ fontSize: 10, color: '#444', padding: '0 5px', flexShrink: 0 }}>{unit}</span>}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: '#444', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{title}</p>
      {children}
    </div>
  )
}

function PropertiesPanel({ data, selectedIds, onUpdate }: {
  data: DesignData; selectedIds: string[]
  onUpdate: (id: string, patch: Partial<DesignNode>) => void
}) {
  const node = selectedIds.length === 1 ? data.nodes[selectedIds[0]!] : null

  if (!node) {
    return <div style={{ padding: 16, color: '#444', fontSize: 11, textAlign: 'center' }}>
      {selectedIds.length === 0 ? 'Выберите слой' : `${selectedIds.length} слоёв`}
    </div>
  }

  const up = (patch: Partial<DesignNode>) => onUpdate(node.id, patch)
  const fillHex = colorToHex(node.fill)
  const strokeHex = colorToHex(node.strokeColor)
  const isGroup = node.type === 'group'
  const bounds = isGroup ? computeGroupBounds(node, data.nodes) : node

  return (
    <div style={{ overflow: 'auto', flex: 1, padding: '12px 12px 24px' }}>
      <input value={node.name} onChange={e => up({ name: e.target.value })}
        style={{ width: '100%', background: '#181818', border: '1px solid #2A2A2A', borderRadius: 6, padding: '5px 8px', fontSize: 12, color: '#E8E8E8', outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />

      <Section title="Расположение">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          <PInput label="X" value={Math.round(bounds.x)} onChange={v => up({ x: Number(v) })} />
          <PInput label="Y" value={Math.round(bounds.y)} onChange={v => up({ y: Number(v) })} />
          <PInput label="W" value={Math.round(bounds.w)} onChange={v => up({ w: Math.max(MIN_SIZE, Number(v)) })} min={MIN_SIZE} />
          <PInput label="H" value={Math.round(bounds.h)} onChange={v => up({ h: Math.max(MIN_SIZE, Number(v)) })} min={MIN_SIZE} />
        </div>
      </Section>

      {!isGroup && node.type !== 'text' && (
        <Section title="Заливка">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <input type="color" value={fillHex} onChange={e => up({ fill: e.target.value })}
              style={{ width: 28, height: 24, padding: 0, border: '1px solid #2A2A2A', borderRadius: 4, cursor: 'pointer', background: 'transparent' }} />
            <input type="text" value={fillHex.toUpperCase()}
              onChange={e => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) up({ fill: e.target.value }) }}
              style={{ flex: 1, background: '#181818', border: '1px solid #2A2A2A', borderRadius: 5, padding: '3px 6px', fontSize: 11, color: '#E8E8E8', outline: 'none', fontFamily: 'monospace' }} />
            <input type="number" value={Math.round(node.fillOpacity * 100)} min={0} max={100}
              onChange={e => up({ fillOpacity: Math.max(0, Math.min(1, Number(e.target.value) / 100)) })}
              style={{ width: 44, background: '#181818', border: '1px solid #2A2A2A', borderRadius: 5, padding: '3px 4px', fontSize: 11, color: '#E8E8E8', outline: 'none', textAlign: 'center' }} />
            <span style={{ fontSize: 10, color: '#444' }}>%</span>
          </div>
        </Section>
      )}

      {!isGroup && node.type !== 'text' && (
        <Section title="Обводка">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <input type="color" value={strokeHex} onChange={e => up({ strokeColor: e.target.value })}
              style={{ width: 28, height: 24, padding: 0, border: '1px solid #2A2A2A', borderRadius: 4, cursor: 'pointer', background: 'transparent' }} />
            <input type="number" value={node.strokeWidth} min={0} max={20}
              onChange={e => up({ strokeWidth: Number(e.target.value) })}
              style={{ width: 52, background: '#181818', border: '1px solid #2A2A2A', borderRadius: 5, padding: '3px 6px', fontSize: 11, color: '#E8E8E8', outline: 'none' }} />
            <span style={{ fontSize: 10, color: '#444' }}>px</span>
          </div>
        </Section>
      )}

      {node.type !== 'ellipse' && node.type !== 'text' && !isGroup && (
        <Section title="Скругление">
          <PInput label="R" value={node.borderRadius} onChange={v => up({ borderRadius: Math.max(0, Number(v)) })} min={0} />
        </Section>
      )}

      <Section title="Прозрачность">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="range" value={Math.round(node.opacity * 100)} min={0} max={100}
            onChange={e => up({ opacity: Number(e.target.value) / 100 })}
            style={{ flex: 1, accentColor: '#0099FF' }} />
          <span style={{ fontSize: 11, color: '#888', width: 32, textAlign: 'right' }}>{Math.round(node.opacity * 100)}%</span>
        </div>
      </Section>

      {node.type === 'text' && (
        <Section title="Текст">
          <textarea value={node.text ?? ''} onChange={e => up({ text: e.target.value })} rows={3}
            style={{ width: '100%', background: '#181818', border: '1px solid #2A2A2A', borderRadius: 6, padding: '6px 8px', fontSize: 12, color: '#E8E8E8', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8, fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: '#555', width: 32 }}>Цвет</span>
            <input type="color" value={colorToHex(node.textColor)} onChange={e => up({ textColor: e.target.value })}
              style={{ width: 28, height: 24, padding: 0, border: '1px solid #2A2A2A', borderRadius: 4, cursor: 'pointer', background: 'transparent' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 }}>
            <PInput label="S" value={node.fontSize ?? 16} onChange={v => up({ fontSize: Math.max(1, Number(v)) })} min={1} />
            <div>
              <select value={node.fontWeight ?? 400} onChange={e => up({ fontWeight: Number(e.target.value) })}
                style={{ width: '100%', background: '#181818', border: '1px solid #2A2A2A', borderRadius: 5, padding: '4px 6px', fontSize: 11, color: '#E8E8E8', outline: 'none' }}>
                {[100,200,300,400,500,600,700,800,900].map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['left','center','right'] as const).map(a => {
              const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight
              const active = (node.textAlign ?? 'left') === a
              return (
                <button key={a} type="button" onClick={() => up({ textAlign: a })}
                  style={{ flex: 1, padding: '5px 0', background: active ? '#1E4A7A' : '#181818', border: `1px solid ${active ? '#0099FF' : '#2A2A2A'}`, borderRadius: 5, color: active ? '#4A9EFF' : '#666', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                  <Icon size={11} />
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {node.type === 'image' && (
        <Section title="Изображение">
          <select value={node.objectFit ?? 'cover'} onChange={e => up({ objectFit: e.target.value as 'cover'|'contain'|'fill' })}
            style={{ width: '100%', background: '#181818', border: '1px solid #2A2A2A', borderRadius: 5, padding: '5px 8px', fontSize: 11, color: '#E8E8E8', outline: 'none' }}>
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
          </select>
        </Section>
      )}
    </div>
  )
}

// ─── Main Editor ───────────────────────────────────────────────────────────────

type DragMode =
  | { type: 'none' }
  | { type: 'pan'; sx: number; sy: number; px0: number; py0: number }
  | { type: 'create'; tool: Tool; sx: number; sy: number; cx: number; cy: number }
  | { type: 'move'; cx0: number; cy0: number; origPos: Record<string, {x:number;y:number}> }
  | { type: 'resize'; handle: Handle; nodeId: string; cx0: number; cy0: number; orig: DesignNode }

export default function DesignEditorPage() {
  const router = useRouter()
  const params = useParams<{ project: string; fileId: string }>()
  const { project: projectSlug, fileId } = params
  const { prompt, confirm, Dialog } = useDialog()

  const [fileName, setFileName] = useState('Загрузка...')
  const [saveStatus, setSaveStatus] = useState<'saved'|'saving'|'unsaved'>('saved')
  const [fileLoaded, setFileLoaded] = useState(false)

  const [data, setData] = useState<DesignData>({ nodes: {}, nodeOrder: [] })
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const nodeCount = useRef(0)

  const [tool, setTool] = useState<Tool>('select')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(80)
  const [panY, setPanY] = useState(80)
  const [spacePressed, setSpacePressed] = useState(false)
  const [editingTextId, setEditingTextId] = useState<string|null>(null)
  const [creationPreview, setCreationPreview] = useState<{x:number;y:number;w:number;h:number}|null>(null)
  const [marquee, setMarquee] = useState<{x:number;y:number;w:number;h:number}|null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const [layersOpen, setLayersOpen] = useState(true)
  const [propsOpen, setPropsOpen] = useState(true)

  const drag = useRef<DragMode>({ type: 'none' })
  const spaceRef = useRef(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const dataRef = useRef(data)
  const zoomRef = useRef(zoom)
  useEffect(() => { dataRef.current = data }, [data])
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  // ── Load ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    void fetch(`/api/design/${fileId}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { ok: boolean; file?: { name: string; data: string } } | null) => {
        if (!d?.ok || !d.file) { router.replace(`/workspace/${projectSlug}`); return }
        setFileName(d.file.name)
        try {
          const p = JSON.parse(d.file.data) as DesignData
          if (p.nodes && p.nodeOrder) {
            setData(p)
            setHistory([p])
            setHistoryIdx(0)
            nodeCount.current = Object.keys(p.nodes).length
          }
        } catch { /* empty */ }
        setFileLoaded(true)
      })
  }, [fileId, projectSlug, router])

  // ── Save ────────────────────────────────────────────────────────────────────

  const scheduleSave = useCallback((d: DesignData) => {
    setSaveStatus('unsaved')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      await fetch(`/api/design/${fileId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: JSON.stringify(d) }) })
      setSaveStatus('saved')
    }, 1500)
  }, [fileId])

  // ── History ─────────────────────────────────────────────────────────────────

  const commit = useCallback((newData: DesignData) => {
    setData(newData)
    setHistory(prev => {
      const s = prev.slice(0, historyIdx + 1)
      return [...s.slice(-49), newData]
    })
    setHistoryIdx(i => Math.min(i + 1, 50))
    scheduleSave(newData)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIdx, scheduleSave])

  const undo = useCallback(() => {
    if (historyIdx <= 0) return
    const ni = historyIdx - 1
    setHistoryIdx(ni)
    setData(history[ni]!)
    scheduleSave(history[ni]!)
    setSelectedIds([])
  }, [history, historyIdx, scheduleSave])

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return
    const ni = historyIdx + 1
    setHistoryIdx(ni)
    setData(history[ni]!)
    scheduleSave(history[ni]!)
    setSelectedIds([])
  }, [history, historyIdx, scheduleSave])

  // ── Node ops ────────────────────────────────────────────────────────────────

  const addNode = useCallback((node: DesignNode) => {
    nodeCount.current++
    const newData = { nodes: { ...dataRef.current.nodes, [node.id]: node }, nodeOrder: [...dataRef.current.nodeOrder, node.id] }
    commit(newData)
    setSelectedIds([node.id])
  }, [commit])

  const updateNode = useCallback((id: string, patch: Partial<DesignNode>, doCommit = true) => {
    const d = dataRef.current
    const node = d.nodes[id]
    if (!node) return
    const updated = { ...d, nodes: { ...d.nodes, [id]: { ...node, ...patch } } }
    if (doCommit) commit(updated)
    else { setData(updated); scheduleSave(updated) }
  }, [commit, scheduleSave])

  const deleteNodes = useCallback((ids: string[]) => {
    const d = dataRef.current
    const newNodes = { ...d.nodes }
    ids.forEach(id => {
      const n = d.nodes[id]
      if (n?.type === 'group') n.children.forEach(cid => delete newNodes[cid])
      delete newNodes[id]
    })
    commit({ nodes: newNodes, nodeOrder: d.nodeOrder.filter(id => !ids.includes(id)) })
    setSelectedIds([])
  }, [commit])

  const duplicateNodes = useCallback((ids: string[]) => {
    if (!ids.length) return
    const d = dataRef.current
    const newNodes = { ...d.nodes }
    const newOrder = [...d.nodeOrder]
    const newSel: string[] = []
    ids.forEach(id => {
      const n = d.nodes[id]; if (!n) return
      nodeCount.current++
      const copy: DesignNode = { ...n, id: uid(), name: n.name + ' Copy', x: n.x + 16, y: n.y + 16, children: [] }
      if (n.type === 'group') {
        n.children.forEach(cid => {
          const child = d.nodes[cid]; if (!child) return
          nodeCount.current++
          const childCopy: DesignNode = { ...child, id: uid(), parentId: copy.id }
          newNodes[childCopy.id] = childCopy
          copy.children.push(childCopy.id)
        })
      }
      newNodes[copy.id] = copy
      newOrder.push(copy.id)
      newSel.push(copy.id)
    })
    commit({ nodes: newNodes, nodeOrder: newOrder })
    setSelectedIds(newSel)
  }, [commit])

  // ── Groups ──────────────────────────────────────────────────────────────────

  const groupSelected = useCallback(() => {
    const d = dataRef.current
    if (selectedIds.length < 2) return
    // Only group top-level nodes
    const toGroup = selectedIds.filter(id => d.nodeOrder.includes(id))
    if (toGroup.length < 2) return
    nodeCount.current++
    const group: DesignNode = { ...makeNode('group', 0, 0, 0, 0, nodeCount.current), children: toGroup }
    toGroup.forEach(id => { if (d.nodes[id]) d.nodes[id]!.parentId = group.id })
    const newNodes = { ...d.nodes }
    toGroup.forEach(id => { const n = newNodes[id]; if (n) newNodes[id] = { ...n, parentId: group.id } })
    newNodes[group.id] = group
    const newOrder = d.nodeOrder.filter(id => !toGroup.includes(id))
    newOrder.push(group.id)
    commit({ nodes: newNodes, nodeOrder: newOrder })
    setSelectedIds([group.id])
  }, [selectedIds, commit])

  const ungroupSelected = useCallback(() => {
    const d = dataRef.current
    const groups = selectedIds.filter(id => d.nodes[id]?.type === 'group')
    if (!groups.length) return
    const newNodes = { ...d.nodes }
    let newOrder = [...d.nodeOrder]
    const newSel: string[] = []
    groups.forEach(gid => {
      const g = newNodes[gid]; if (!g) return
      const insertIdx = newOrder.indexOf(gid)
      newOrder = newOrder.filter(id => id !== gid)
      g.children.forEach((cid, i) => {
        const child = newNodes[cid]; if (!child) return
        newNodes[cid] = { ...child, parentId: null }
        newOrder.splice(insertIdx + i, 0, cid)
        newSel.push(cid)
      })
      delete newNodes[gid]
    })
    commit({ nodes: newNodes, nodeOrder: newOrder })
    setSelectedIds(newSel)
  }, [selectedIds, commit])

  // ── Image drop ──────────────────────────────────────────────────────────────

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const src = ev.target?.result as string
        const img = new window.Image()
        img.onload = () => {
          const maxW = 400, maxH = 400
          let w = img.width, h = img.height
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
          if (h > maxH) { w = Math.round(w * maxH / h); h = maxH }
          const cp = s2c(e.clientX - rect.left, e.clientY - rect.top, panX, panY, zoom)
          nodeCount.current++
          const node = makeNode('image', cp.x - w / 2, cp.y - h / 2, w, h, nodeCount.current)
          addNode({ ...node, imageSrc: src })
        }
        img.src = src
      }
      reader.readAsDataURL(file)
    })
  }, [panX, panY, zoom, addNode])

  // ── Zoom ────────────────────────────────────────────────────────────────────

  const setZoomAt = useCallback((newZ: number, mx: number, my: number) => {
    newZ = Math.max(0.02, Math.min(32, newZ))
    const cur = zoomRef.current
    setPanX(px => mx - (mx - px) * newZ / cur)
    setPanY(py => my - (my - py) * newZ / cur)
    setZoom(newZ)
    zoomRef.current = newZ
  }, [])

  // ── Canvas events ────────────────────────────────────────────────────────────

  const getCP = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return s2c(e.clientX - rect.left, e.clientY - rect.top, panX, panY, zoom)
  }, [panX, panY, zoom])

  const getSP = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const startNodeDrag = useCallback((id: string, e: React.MouseEvent) => {
    if (tool !== 'select') return
    e.preventDefault()
    const d = dataRef.current
    const cp = getCP(e)
    const toProcess = selectedIds.includes(id) ? selectedIds : [id]
    if (!selectedIds.includes(id)) setSelectedIds(e.shiftKey ? [...selectedIds, id] : [id])
    else if (!e.shiftKey && selectedIds.length > 1) setSelectedIds([id])

    if (e.altKey) {
      // Alt+drag: duplicate nodes in-place, then drag the copies
      const newNodes = { ...d.nodes }
      const newOrder = [...d.nodeOrder]
      const newSel: string[] = []
      toProcess.forEach(nid => {
        const n = d.nodes[nid]; if (!n) return
        nodeCount.current++
        const copy: DesignNode = { ...n, id: uid(), children: [] }
        if (n.type === 'group') {
          n.children.forEach(cid => {
            const child = d.nodes[cid]; if (!child) return
            nodeCount.current++
            const childCopy: DesignNode = { ...child, id: uid(), parentId: copy.id }
            newNodes[childCopy.id] = childCopy
            copy.children.push(childCopy.id)
          })
        }
        newNodes[copy.id] = copy
        newOrder.push(copy.id)
        newSel.push(copy.id)
      })
      const newData = { nodes: newNodes, nodeOrder: newOrder }
      dataRef.current = newData
      setData(newData)
      setSelectedIds(newSel)
      const origPos: Record<string, {x:number;y:number}> = {}
      newSel.forEach(nid => {
        const n = newNodes[nid]; if (!n) return
        if (n.type === 'group') {
          const b = computeGroupBounds(n, newNodes)
          origPos[nid] = { x: b.x, y: b.y }
          n.children.forEach(cid => { const c = newNodes[cid]; if (c) origPos[cid] = { x: c.x, y: c.y } })
        } else {
          origPos[nid] = { x: n.x, y: n.y }
        }
      })
      drag.current = { type: 'move', cx0: cp.x, cy0: cp.y, origPos }
      return
    }

    const origPos: Record<string, {x:number;y:number}> = {}
    toProcess.forEach(nid => {
      const n = d.nodes[nid]; if (!n) return
      if (n.type === 'group') {
        const b = computeGroupBounds(n, d.nodes)
        origPos[nid] = { x: b.x, y: b.y }
        n.children.forEach(cid => { const c = d.nodes[cid]; if (c) origPos[cid] = { x: c.x, y: c.y } })
      } else {
        origPos[nid] = { x: n.x, y: n.y }
      }
    })
    drag.current = { type: 'move', cx0: cp.x, cy0: cp.y, origPos }
  }, [tool, selectedIds, getCP])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && spaceRef.current)) {
      const sp = getSP(e)
      drag.current = { type: 'pan', sx: sp.x, sy: sp.y, px0: panX, py0: panY }
      return
    }
    if (e.button !== 0) return
    const cp = getCP(e)
    if (tool === 'select') {
      setSelectedIds([])
      const sp = getSP(e)
      drag.current = { type: 'none' }
      // Start marquee
      drag.current = { type: 'create', tool: 'select' as Tool, sx: cp.x, sy: cp.y, cx: cp.x, cy: cp.y }
      setMarquee({ x: sp.x, y: sp.y, w: 0, h: 0 })
    } else {
      drag.current = { type: 'create', tool, sx: cp.x, sy: cp.y, cx: cp.x, cy: cp.y }
      setCreationPreview(null)
    }
  }, [tool, panX, panY, getSP, getCP])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = drag.current
      if (d.type === 'none') return
      e.preventDefault()
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      if (d.type === 'pan') {
        const sx = e.clientX - rect.left, sy = e.clientY - rect.top
        setPanX(d.px0 + sx - d.sx)
        setPanY(d.py0 + sy - d.sy)
        return
      }

      if (d.type === 'create') {
        const cp = s2c(e.clientX - rect.left, e.clientY - rect.top, panX, panY, zoom)
        drag.current = { ...d, cx: cp.x, cy: cp.y }
        if (d.tool === 'select') {
          const x0 = Math.min(d.sx, cp.x) * zoom + panX
          const y0 = Math.min(d.sy, cp.y) * zoom + panY
          const x1 = Math.max(d.sx, cp.x) * zoom + panX
          const y1 = Math.max(d.sy, cp.y) * zoom + panY
          setMarquee({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 })
        } else {
          const x = Math.min(d.sx, cp.x), y = Math.min(d.sy, cp.y)
          setCreationPreview({ x, y, w: Math.abs(cp.x - d.sx), h: Math.abs(cp.y - d.sy) })
        }
        return
      }

      if (d.type === 'move') {
        const cp = s2c(e.clientX - rect.left, e.clientY - rect.top, panX, panY, zoom)
        const dx = cp.x - d.cx0, dy = cp.y - d.cy0
        const cur = dataRef.current
        const newNodes = { ...cur.nodes }
        Object.entries(d.origPos).forEach(([id, orig]) => {
          const n = newNodes[id]; if (!n) return
          if (n.type === 'group') return // group position is derived
          newNodes[id] = { ...n, x: snap(orig.x + dx), y: snap(orig.y + dy) }
        })
        setData({ ...cur, nodes: newNodes })
        return
      }

      if (d.type === 'resize') {
        const cp = s2c(e.clientX - rect.left, e.clientY - rect.top, panX, panY, zoom)
        const dx = cp.x - d.cx0, dy = cp.y - d.cy0
        const patch = resizePatch(d.orig, d.handle, dx, dy)
        const cur = dataRef.current
        setData({ ...cur, nodes: { ...cur.nodes, [d.nodeId]: { ...d.orig, ...patch } } })
      }
    }

    const onUp = (e: MouseEvent) => {
      const d = drag.current
      drag.current = { type: 'none' }

      if (d.type === 'create') {
        const w = Math.abs(d.cx - d.sx), h = Math.abs(d.cy - d.sy)
        setCreationPreview(null); setMarquee(null)

        if (d.tool === 'select') {
          const x0 = Math.min(d.sx, d.cx), y0 = Math.min(d.sy, d.cy)
          const x1 = Math.max(d.sx, d.cx), y1 = Math.max(d.sy, d.cy)
          const hit = dataRef.current.nodeOrder.filter(id => {
            const n = dataRef.current.nodes[id]; if (!n || !n.visible || n.locked) return false
            const bx = n.type === 'group' ? computeGroupBounds(n, dataRef.current.nodes).x : n.x
            const by = n.type === 'group' ? computeGroupBounds(n, dataRef.current.nodes).y : n.y
            const bw = n.type === 'group' ? computeGroupBounds(n, dataRef.current.nodes).w : n.w
            const bh = n.type === 'group' ? computeGroupBounds(n, dataRef.current.nodes).h : n.h
            return bx < x1 && bx + bw > x0 && by < y1 && by + bh > y0
          })
          setSelectedIds(hit)
          return
        }

        if (w > MIN_SIZE && h > MIN_SIZE) {
          const x = Math.min(d.sx, d.cx), y = Math.min(d.sy, d.cy)
          nodeCount.current++
          const node = makeNode(d.tool as NodeType, x, y, w, h, nodeCount.current)
          addNode(node)
          if (d.tool === 'text') setEditingTextId(node.id)
          setTool('select')
        } else if (d.tool === 'text') {
          nodeCount.current++
          const node = makeNode('text', d.sx, d.sy, 120, 40, nodeCount.current)
          addNode(node)
          setEditingTextId(node.id)
          setTool('select')
        }
        return
      }

      if (d.type === 'move' || d.type === 'resize') {
        commit(dataRef.current)
      }
    }

    window.addEventListener('mousemove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [panX, panY, zoom, addNode, commit])

  // ── Wheel + Safari gesture ───────────────────────────────────────────────────

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left, my = e.clientY - rect.top
      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom (Chrome/Firefox) or Ctrl+scroll
        const factor = Math.pow(0.998, e.deltaY)
        setZoomAt(Math.max(0.02, Math.min(32, zoomRef.current * factor)), mx, my)
      } else {
        const dx = e.deltaX * (e.deltaMode === 1 ? 20 : 1)
        const dy = e.deltaY * (e.deltaMode === 1 ? 20 : 1)
        setPanX(px => px - dx)
        setPanY(py => py - dy)
      }
    }

    // Safari trackpad: gesturechange fires during pinch
    let gestureStartZoom = 1
    const onGestureStart = (e: Event) => {
      e.preventDefault()
      gestureStartZoom = zoomRef.current
    }
    const onGestureChange = (e: Event) => {
      e.preventDefault()
      const ge = e as unknown as { scale: number; clientX: number; clientY: number }
      const rect = el.getBoundingClientRect()
      const mx = ge.clientX - rect.left, my = ge.clientY - rect.top
      setZoomAt(Math.max(0.02, Math.min(32, gestureStartZoom * ge.scale)), mx, my)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('gesturestart', onGestureStart, { passive: false })
    el.addEventListener('gesturechange', onGestureChange, { passive: false })
    el.addEventListener('gestureend', onGestureChange, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('gesturestart', onGestureStart)
      el.removeEventListener('gesturechange', onGestureChange)
      el.removeEventListener('gestureend', onGestureChange)
    }
  // fileLoaded ensures canvas is in DOM before attaching listeners
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setZoomAt, fileLoaded])

  // ── Keyboard ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const inInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement
      if (e.code === 'Space' && !inInput) { spaceRef.current = true; setSpacePressed(true); e.preventDefault() }
      if (inInput) return
      if (e.key === 'v' || e.key === 'V') setTool('select')
      if (e.key === 'r' || e.key === 'R') setTool('rect')
      if (e.key === 'o' || e.key === 'O') setTool('ellipse')
      if (e.key === 'f' || e.key === 'F') setTool('frame')
      if (e.key === 't' || e.key === 'T') setTool('text')
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) deleteNodes(selectedIds)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); setSelectedIds(dataRef.current.nodeOrder) }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicateNodes(selectedIds) }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) { e.preventDefault(); groupSelected() }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'g') { e.preventDefault(); ungroupSelected() }
      if (e.key === 'Escape') { setSelectedIds([]); setEditingTextId(null); setTool('select') }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (saveTimer.current) clearTimeout(saveTimer.current)
        setSaveStatus('saving')
        void fetch(`/api/design/${fileId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: JSON.stringify(dataRef.current) }) }).then(() => setSaveStatus('saved'))
      }
      if (!e.ctrlKey && !e.metaKey && selectedIds.length > 0) {
        const step = e.shiftKey ? 10 : 1
        let dx = 0, dy = 0
        if (e.key === 'ArrowLeft') { dx = -step; e.preventDefault() }
        if (e.key === 'ArrowRight') { dx = step; e.preventDefault() }
        if (e.key === 'ArrowUp') { dy = -step; e.preventDefault() }
        if (e.key === 'ArrowDown') { dy = step; e.preventDefault() }
        if (dx || dy) {
          const d = dataRef.current
          const newNodes = { ...d.nodes }
          selectedIds.forEach(id => { const n = newNodes[id]; if (n && n.type !== 'group') newNodes[id] = { ...n, x: n.x + dx, y: n.y + dy } })
          commit({ ...d, nodes: newNodes })
        }
      }
    }
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') { spaceRef.current = false; setSpacePressed(false) } }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [selectedIds, undo, redo, duplicateNodes, groupSelected, ungroupSelected, deleteNodes, commit, fileId])

  // ── Resize handles start ─────────────────────────────────────────────────────

  const startResize = useCallback((nodeId: string, handle: Handle, e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault()
    const node = dataRef.current.nodes[nodeId]; if (!node) return
    const cp = getCP(e)
    drag.current = { type: 'resize', handle, nodeId, cx0: cp.x, cy0: cp.y, orig: { ...node } }
  }, [getCP])

  // ── Selection handles ────────────────────────────────────────────────────────

  function getSelHandles(node: DesignNode) {
    const { x, y, w, h } = node.type === 'group' ? computeGroupBounds(node, data.nodes) : node
    const sx = x * zoom + panX, sy = y * zoom + panY
    const sw = w * zoom, sh = h * zoom
    const dirs: Array<{d:Handle;x:number;y:number}> = [
      {d:'tl',x:sx,    y:sy},    {d:'t',x:sx+sw/2,y:sy},    {d:'tr',x:sx+sw,y:sy},
      {d:'l', x:sx,    y:sy+sh/2},                            {d:'r', x:sx+sw,y:sy+sh/2},
      {d:'bl',x:sx,    y:sy+sh}, {d:'b',x:sx+sw/2,y:sy+sh}, {d:'br',x:sx+sw,y:sy+sh},
    ]
    return { sx, sy, sw, sh, dirs }
  }

  const canvasStyle = spacePressed
    ? (drag.current.type === 'pan' ? 'grabbing' : 'grab')
    : tool === 'select' ? 'default' : 'crosshair'

  const TOOLS: Array<{id:Tool;icon:React.ElementType;title:string}> = [
    {id:'select',  icon:MousePointer2, title:'Выделение (V)'},
    {id:'frame',   icon:LayoutTemplate,title:'Фрейм (F)'},
    {id:'rect',    icon:Square,        title:'Прямоугольник (R)'},
    {id:'ellipse', icon:Circle,        title:'Эллипс (O)'},
    {id:'text',    icon:Type,          title:'Текст (T)'},
  ]

  if (!fileLoaded) return (
    <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'#111', color:'#555', fontFamily:'system-ui, sans-serif' }}>Загрузка...</div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#111', color:'#E8E8E8', fontFamily:'system-ui, sans-serif', overflow:'hidden' }}>
      {Dialog}

      {/* ── Toolbar ── */}
      <div style={{ height:48, flexShrink:0, display:'flex', alignItems:'center', borderBottom:'1px solid #1E1E1E', background:'#111', zIndex:10 }}>

        {/* Left */}
        <div style={{ width:240, flexShrink:0, display:'flex', alignItems:'center', gap:6, padding:'0 12px', borderRight:'1px solid #1E1E1E' }}>
          <button type="button"
            style={{ display:'flex', alignItems:'center', gap:4, background:'transparent', border:'none', cursor:'pointer', color:'#555', fontSize:11, padding:'4px 6px', borderRadius:5 }}
            onMouseEnter={e => { e.currentTarget.style.color='#999'; e.currentTarget.style.background='#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.color='#555'; e.currentTarget.style.background='transparent' }}
            onClick={() => router.push(`/workspace/${projectSlug}`)}
          ><ArrowLeft size={11}/> Проект</button>
          <div style={{ width:1, height:14, background:'#2A2A2A' }}/>
          <input value={fileName} onChange={e => setFileName(e.target.value)}
            onBlur={async () => { await fetch(`/api/design/${fileId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name:fileName }) }) }}
            style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:13, fontWeight:600, color:'#E8E8E8', minWidth:0 }} />
        </div>

        {/* Center tools */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
          {TOOLS.map(({id,icon:Icon,title}) => (
            <button key={id} type="button" title={title}
              style={{ width:36, height:36, borderRadius:8, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', background:tool===id?'#1E4A7A':'transparent', color:tool===id?'#4A9EFF':'#666' }}
              onMouseEnter={e => { if(tool!==id){ e.currentTarget.style.background='#1C1C1C'; e.currentTarget.style.color='#E8E8E8' }}}
              onMouseLeave={e => { if(tool!==id){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#666' }}}
              onClick={() => setTool(id)}
            ><Icon size={15}/></button>
          ))}

          <div style={{ width:1, height:18, background:'#2A2A2A', margin:'0 4px' }}/>

          <button type="button" title="Группировать (Ctrl+G)" onClick={groupSelected} disabled={selectedIds.length < 2}
            style={{ width:32, height:32, borderRadius:7, border:'none', cursor:selectedIds.length>=2?'pointer':'default', background:'transparent', color:selectedIds.length>=2?'#666':'#333', display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e => { if(selectedIds.length>=2){ e.currentTarget.style.background='#1C1C1C'; e.currentTarget.style.color='#E8E8E8' }}}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=selectedIds.length>=2?'#666':'#333' }}
          ><Group size={13}/></button>

          <button type="button" title="Разгруппировать (Ctrl+Shift+G)" onClick={ungroupSelected}
            style={{ width:32, height:32, borderRadius:7, border:'none', cursor:'pointer', background:'transparent', color:'#666', display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e => { e.currentTarget.style.background='#1C1C1C'; e.currentTarget.style.color='#E8E8E8' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#666' }}
          ><Ungroup size={13}/></button>

          <div style={{ width:1, height:18, background:'#2A2A2A', margin:'0 4px' }}/>

          <button type="button" title="Отменить (Ctrl+Z)" onClick={undo} disabled={historyIdx<=0}
            style={{ width:32, height:32, borderRadius:7, border:'none', cursor:historyIdx>0?'pointer':'default', background:'transparent', color:historyIdx>0?'#666':'#333', display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e => { if(historyIdx>0){ e.currentTarget.style.background='#1C1C1C'; e.currentTarget.style.color='#E8E8E8' }}}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=historyIdx>0?'#666':'#333' }}
          ><Undo2 size={14}/></button>
          <button type="button" title="Повторить (Ctrl+Y)" onClick={redo} disabled={historyIdx>=history.length-1}
            style={{ width:32, height:32, borderRadius:7, border:'none', cursor:historyIdx<history.length-1?'pointer':'default', background:'transparent', color:historyIdx<history.length-1?'#666':'#333', display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e => { if(historyIdx<history.length-1){ e.currentTarget.style.background='#1C1C1C'; e.currentTarget.style.color='#E8E8E8' }}}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=historyIdx<history.length-1?'#666':'#333' }}
          ><Redo2 size={14}/></button>
        </div>

        {/* Right: zoom + save */}
        <div style={{ width:260, flexShrink:0, display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', padding:'0 12px', borderLeft:'1px solid #1E1E1E' }}>
          <button type="button" onClick={() => setZoomAt(Math.max(0.02,zoom/1.25), canvasRef.current!.clientWidth/2, canvasRef.current!.clientHeight/2)} style={{ width:28, height:28, borderRadius:6, background:'#1C1C1C', border:'1px solid #2C2C2C', cursor:'pointer', color:'#888', display:'flex', alignItems:'center', justifyContent:'center' }}><Minus size={11}/></button>
          <button type="button" onClick={() => { setZoom(1); setPanX(80); setPanY(80) }}
            style={{ minWidth:54, height:28, borderRadius:6, background:'#1C1C1C', border:'1px solid #2C2C2C', cursor:'pointer', color:'#999', fontSize:11, fontWeight:600 }}
          >{Math.round(zoom*100)}%</button>
          <button type="button" onClick={() => setZoomAt(Math.min(32,zoom*1.25), canvasRef.current!.clientWidth/2, canvasRef.current!.clientHeight/2)} style={{ width:28, height:28, borderRadius:6, background:'#1C1C1C', border:'1px solid #2C2C2C', cursor:'pointer', color:'#888', display:'flex', alignItems:'center', justifyContent:'center' }}><Plus size={11}/></button>
          <div style={{ width:1, height:14, background:'#2A2A2A', margin:'0 2px' }}/>
          <div style={{ fontSize:11, color:saveStatus==='saved'?'#4A9EFF':saveStatus==='saving'?'#888':'#F59E0B', display:'flex', alignItems:'center', gap:4 }}>
            <Save size={11}/>
            {saveStatus==='saved'?'Сохранено':saveStatus==='saving'?'Сохранение...':'Не сохранено'}
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Left: Layers */}
        <div style={{ width: layersOpen ? 240 : 36, flexShrink:0, borderRight:'1px solid #1E1E1E', display:'flex', flexDirection:'column', background:'#111', transition:'width 0.2s ease', overflow:'hidden' }}>
          <div style={{ height:36, display:'flex', alignItems:'center', padding:'0 8px', borderBottom:'1px solid #1E1E1E', flexShrink:0, gap:4 }}>
            <button type="button" title={layersOpen ? 'Свернуть' : 'Развернуть'}
              style={{ width:20, height:20, borderRadius:4, background:'transparent', border:'none', cursor:'pointer', color:'#555', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
              onMouseEnter={e => { e.currentTarget.style.color='#999' }}
              onMouseLeave={e => { e.currentTarget.style.color='#555' }}
              onClick={() => setLayersOpen(v => !v)}
            ><ChevronRight size={11} style={{ transform: layersOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}/></button>
            {layersOpen && <>
              <Layers size={11} style={{ color:'#555' }}/>
              <span style={{ fontSize:11, fontWeight:600, color:'#555', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>Слои</span>
              <span style={{ marginLeft:'auto', fontSize:10, color:'#333' }}>{data.nodeOrder.length}</span>
            </>}
          </div>
          {layersOpen && <>
            <LayersPanel data={data} selectedIds={selectedIds}
              onSelect={(id,multi) => setSelectedIds(prev => multi ? (prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]) : [id])}
              onToggleVisible={id => updateNode(id, { visible: !data.nodes[id]?.visible })}
              onToggleLock={id => updateNode(id, { locked: !data.nodes[id]?.locked })}
              onRename={async id => {
                const node = data.nodes[id]; if (!node) return
                const name = await prompt('Имя слоя', node.name)
                if (name?.trim()) updateNode(id, { name: name.trim() })
              }}
            />
            {selectedIds.length > 0 && (
              <div style={{ padding:'8px', borderTop:'1px solid #1E1E1E', display:'flex', gap:4 }}>
                <button type="button" onClick={() => duplicateNodes(selectedIds)}
                  style={{ flex:1, padding:'5px 0', background:'#1C1C1C', border:'1px solid #2A2A2A', borderRadius:6, color:'#777', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontSize:11 }}
                  onMouseEnter={e => { e.currentTarget.style.color='#E8E8E8' }}
                  onMouseLeave={e => { e.currentTarget.style.color='#777' }}
                ><Copy size={10}/> Копия</button>
                <button type="button" onClick={() => deleteNodes(selectedIds)}
                  style={{ flex:1, padding:'5px 0', background:'#1C1C1C', border:'1px solid #2A2A2A', borderRadius:6, color:'#777', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontSize:11 }}
                  onMouseEnter={e => { e.currentTarget.style.color='#ef4444' }}
                  onMouseLeave={e => { e.currentTarget.style.color='#777' }}
                ><Trash2 size={10}/> Удалить</button>
              </div>
            )}
          </>}
        </div>

        {/* Center: Canvas */}
        <div ref={canvasRef}
          style={{ flex:1, position:'relative', overflow:'hidden', background: isDraggingOver ? 'rgba(0,153,255,0.05)' : '#1A1A1A', cursor:canvasStyle, outline: isDraggingOver ? '2px dashed #0099FF' : 'none' }}
          onMouseDown={handleCanvasMouseDown}
          onDragOver={e => { e.preventDefault(); setIsDraggingOver(true) }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
        >
          {/* Dot grid */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none',
            backgroundImage:'radial-gradient(circle, #2E2E2E 1px, transparent 1px)',
            backgroundSize:`${20*zoom}px ${20*zoom}px`,
            backgroundPosition:`${panX%(20*zoom)}px ${panY%(20*zoom)}px`,
            opacity: zoom>0.15?1:0 }}/>

          {/* Canvas transform */}
          <div style={{ position:'absolute', top:0, left:0, transformOrigin:'0 0', transform:`translate(${panX}px,${panY}px) scale(${zoom})` }}>
            {data.nodeOrder.map(id => (
              <CanvasNodeRenderer key={id} nodeId={id} nodes={data.nodes} selectedIds={selectedIds} zoom={zoom} panX={panX} panY={panY}
                onNodeMouseDown={startNodeDrag} />
            ))}
            {creationPreview && (
              <div style={{ position:'absolute', left:creationPreview.x, top:creationPreview.y, width:creationPreview.w, height:creationPreview.h,
                border:'1.5px dashed #0099FF', borderRadius:tool==='ellipse'?'50%':0, background:'rgba(0,153,255,0.05)', pointerEvents:'none' }}/>
            )}
          </div>

          {/* Selection overlays (screen space) */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
            {selectedIds.map(id => {
              const node = data.nodes[id]; if (!node) return null
              const { sx, sy, sw, sh, dirs } = getSelHandles(node)
              return (
                <React.Fragment key={id}>
                  <div style={{ position:'absolute', left:sx, top:sy, width:sw, height:sh, border:'1.5px solid #0099FF', pointerEvents:'none', boxSizing:'border-box' }}/>
                  {dirs.map(({d,x,y}) => (
                    <div key={d} style={{ position:'absolute', left:x-HANDLE_SIZE/2, top:y-HANDLE_SIZE/2, width:HANDLE_SIZE, height:HANDLE_SIZE, background:'#fff', border:'1.5px solid #0099FF', borderRadius:2, cursor:HANDLE_CURSORS[d], pointerEvents:'all', boxSizing:'border-box', zIndex:10 }}
                      onMouseDown={e => startResize(id, d, e)}/>
                  ))}
                </React.Fragment>
              )
            })}
            {marquee && <div style={{ position:'absolute', left:marquee.x, top:marquee.y, width:marquee.w, height:marquee.h, border:'1px solid #0099FF', background:'rgba(0,153,255,0.07)', pointerEvents:'none' }}/>}
          </div>

          {/* Drag-over hint */}
          {isDraggingOver && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, background:'rgba(0,153,255,0.15)', border:'2px dashed #0099FF', borderRadius:16, padding:'24px 48px' }}>
                <ImageIcon size={32} style={{ color:'#4A9EFF' }}/>
                <span style={{ color:'#4A9EFF', fontSize:13, fontWeight:600 }}>Отпустите для добавления изображения</span>
              </div>
            </div>
          )}

          {/* Text editing overlay */}
          {editingTextId && (() => {
            const node = data.nodes[editingTextId]
            if (!node || node.type !== 'text') return null
            return (
              <textarea autoFocus value={node.text??''} onChange={e => updateNode(editingTextId, { text:e.target.value }, false)}
                onBlur={() => { commit(dataRef.current); setEditingTextId(null) }}
                onKeyDown={e => { if(e.key==='Escape'){ setEditingTextId(null); e.preventDefault() } e.stopPropagation() }}
                style={{ position:'absolute', left:node.x*zoom+panX, top:node.y*zoom+panY, width:node.w*zoom, height:node.h*zoom, fontSize:(node.fontSize??16)*zoom, fontWeight:node.fontWeight, fontFamily:node.fontFamily, color:node.textColor, textAlign:node.textAlign, lineHeight:node.lineHeight, background:'transparent', border:'1.5px solid #0099FF', outline:'none', resize:'none', padding:2*zoom, boxSizing:'border-box', zIndex:20 }}
              />
            )
          })()}

          {/* Hint */}
          <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.65)', border:'1px solid #222', borderRadius:8, padding:'4px 12px', fontSize:10, color:'#555', pointerEvents:'none', backdropFilter:'blur(4px)', whiteSpace:'nowrap' }}>
            V · R · O · F · T &nbsp;|&nbsp; Ctrl+G группа &nbsp;|&nbsp; Пробел панорама &nbsp;|&nbsp; Ctrl+колесо масштаб &nbsp;|&nbsp; Перетащите изображение
          </div>
        </div>

        {/* Right: Properties */}
        <div style={{ width: propsOpen ? 260 : 36, flexShrink:0, borderLeft:'1px solid #1E1E1E', display:'flex', flexDirection:'column', background:'#111', transition:'width 0.2s ease', overflow:'hidden' }}>
          <div style={{ height:36, display:'flex', alignItems:'center', padding:'0 8px', borderBottom:'1px solid #1E1E1E', flexShrink:0, gap:4 }}>
            <button type="button" title={propsOpen ? 'Свернуть' : 'Развернуть'}
              style={{ width:20, height:20, borderRadius:4, background:'transparent', border:'none', cursor:'pointer', color:'#555', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
              onMouseEnter={e => { e.currentTarget.style.color='#999' }}
              onMouseLeave={e => { e.currentTarget.style.color='#555' }}
              onClick={() => setPropsOpen(v => !v)}
            ><ChevronRight size={11} style={{ transform: propsOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition:'transform 0.2s' }}/></button>
            {propsOpen && <span style={{ fontSize:11, fontWeight:600, color:'#555', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>Свойства</span>}
          </div>
          {propsOpen && <PropertiesPanel data={data} selectedIds={selectedIds} onUpdate={(id,patch) => updateNode(id, patch)} />}
        </div>
      </div>
    </div>
  )
}
