import { cookies } from 'next/headers'
import { findUserByEmail } from '../../../../lib/users-store'
import { verifyPassword, signToken, setSessionCookie } from '../../../../lib/auth'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string }

    if (!body.email?.trim() || !body.password) {
      return Response.json({ ok: false, error: 'Email и пароль обязательны' }, { status: 400 })
    }

    const user = await findUserByEmail(body.email.trim())
    if (!user) {
      return Response.json({ ok: false, error: 'Неверный email или пароль' }, { status: 401 })
    }

    const valid = await verifyPassword(body.password, user.passwordHash)
    if (!valid) {
      return Response.json({ ok: false, error: 'Неверный email или пароль' }, { status: 401 })
    }

    const token = await signToken({ userId: user.id, email: user.email, name: user.name })
    const cookieStore = await cookies()
    setSessionCookie(cookieStore, token)

    return Response.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка входа'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
