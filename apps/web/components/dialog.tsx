'use client'

import React, { useState, useCallback, useRef } from 'react'

type DialogState =
  | null
  | { kind: 'prompt'; msg: string; val: string; ok: (v: string | null) => void }
  | { kind: 'confirm'; msg: string; ok: (v: boolean) => void }

export function useDialog() {
  const [state, setState] = useState<DialogState>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const prompt = useCallback(
    (msg: string, def = ''): Promise<string | null> =>
      new Promise(ok => setState({ kind: 'prompt', msg, val: def, ok: v => { setState(null); ok(v) } })),
    [],
  )

  const confirm = useCallback(
    (msg: string): Promise<boolean> =>
      new Promise(ok => setState({ kind: 'confirm', msg, ok: v => { setState(null); ok(v) } })),
    [],
  )

  const Dialog = state === null ? null : (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) { state.kind === 'prompt' ? state.ok(null) : state.ok(false) } }}
    >
      <div style={{ background: '#1C1C1C', border: '1px solid #303030', borderRadius: 14, padding: 24, minWidth: 320, maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#C8C8C8', lineHeight: 1.5 }}>{state.msg}</p>

        {state.kind === 'prompt' && (
          <input
            ref={inputRef}
            autoFocus
            defaultValue={state.val}
            style={{ width: '100%', background: '#141414', border: '1px solid #3A3A3A', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#E8E8E8', outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
            onKeyDown={e => {
              if (e.key === 'Enter') state.ok(inputRef.current?.value ?? '')
              if (e.key === 'Escape') state.ok(null)
            }}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button"
            style={{ padding: '7px 16px', background: '#2A2A2A', border: '1px solid #3A3A3A', borderRadius: 8, color: '#888', fontSize: 12, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#333' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2A2A2A' }}
            onClick={() => state.kind === 'prompt' ? state.ok(null) : state.ok(false)}
          >Отмена</button>
          <button type="button"
            style={{ padding: '7px 16px', background: state.kind === 'confirm' ? '#ef4444' : '#0099FF', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            onClick={() => {
              if (state.kind === 'prompt') state.ok(inputRef.current?.value ?? '')
              else state.ok(true)
            }}
          >{state.kind === 'confirm' ? 'Удалить' : 'OK'}</button>
        </div>
      </div>
    </div>
  )

  return { prompt, confirm, Dialog }
}
