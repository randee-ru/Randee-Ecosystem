import { SignJWT, jwtVerify } from 'jose'
import { scrypt, randomBytes } from 'node:crypto'
import { promisify } from 'node:util'
import type { cookies } from 'next/headers'
import { COOKIE_NAME, AUTH_SECRET } from './auth-config'

const scryptAsync = promisify(scrypt)

const JWT_SECRET = new TextEncoder().encode(AUTH_SECRET)
const TOKEN_TTL = '30d'

export type SessionPayload = {
  userId: string
  email: string
  name: string
}

// ── Пароли ────────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  return derived.toString('hex') === hash
}

// ── JWT ───────────────────────────────────────────────────────────────────────

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function setSessionCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  token: string,
) {
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 дней
    path: '/',
  })
}

export function clearSessionCookie(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.delete(COOKIE_NAME)
}

export async function getSession(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<SessionPayload | null> {
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export { COOKIE_NAME } from './auth-config'
