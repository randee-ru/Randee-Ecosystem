'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function RandeeLogo() {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12,
      background: 'linear-gradient(135deg,#0099FF,#6366F1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>R</span>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next') ?? '/workspace'

  const [mode, setMode] = React.useState<'login' | 'register'>('login')
  const [email, setEmail] = React.useState('')
  const [name, setName] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email, password }
        : { email, name, password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { ok: boolean; error?: string }

      if (!data.ok) {
        setError(data.error ?? 'Что-то пошло не так')
        return
      }

      router.push(nextUrl)
      router.refresh()
    } catch {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#111',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: '#1C1C1C', border: '1px solid #2C2C2C',
        borderRadius: 18, padding: 32,
      }}>
        {/* Логотип */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <RandeeLogo />
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#E8E8E8' }}>Randee</p>
            <p style={{ margin: 0, fontSize: 11, color: '#555' }}>Visual Builder</p>
          </div>
        </div>

        {/* Заголовок */}
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#E8E8E8' }}>
          {mode === 'login' ? 'Вход в аккаунт' : 'Создать аккаунт'}
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: 13, color: '#555' }}>
          {mode === 'login'
            ? 'Введите email и пароль чтобы войти'
            : 'Зарегистрируйтесь чтобы начать'}
        </p>

        {/* Форма */}
        <form onSubmit={(e) => void submit(e)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>
                Имя
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Иван Иванов"
                required
                autoFocus={mode === 'register'}
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus={mode === 'login'}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Минимум 6 символов' : '••••••••'}
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 12, color: '#ef4444',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px 0', borderRadius: 10,
              background: loading ? '#1a4a7a' : '#0099FF',
              border: 'none', color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s', marginTop: 4,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#33AAFF' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0099FF' }}
          >
            {loading
              ? 'Загрузка...'
              : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        {/* Переключение режима */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#555' }}>
          {mode === 'login' ? (
            <>
              Нет аккаунта?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError('') }}
                style={{ background: 'none', border: 'none', color: '#0099FF', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                Зарегистрироваться
              </button>
            </>
          ) : (
            <>
              Уже есть аккаунт?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError('') }}
                style={{ background: 'none', border: 'none', color: '#0099FF', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                Войти
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#141414',
  border: '1px solid #2C2C2C',
  borderRadius: 9,
  color: '#E8E8E8',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
}
