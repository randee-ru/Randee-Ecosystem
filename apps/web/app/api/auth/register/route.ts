import { cookies } from 'next/headers'
import { createUser, findUserByEmail } from '../../../../lib/users-store'
import { hashPassword, signToken, setSessionCookie } from '../../../../lib/auth'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; name?: string; password?: string }

    if (!body.email?.trim() || !body.name?.trim() || !body.password) {
      return Response.json({ ok: false, error: 'Все поля обязательны' }, { status: 400 })
    }

    if (body.password.length < 6) {
      return Response.json({ ok: false, error: 'Пароль минимум 6 символов' }, { status: 400 })
    }

    const existing = await findUserByEmail(body.email.trim())
    if (existing) {
      return Response.json({ ok: false, error: 'Email уже зарегистрирован' }, { status: 409 })
    }

    const passwordHash = await hashPassword(body.password)
    const user = await createUser({
      email: body.email.trim(),
      name: body.name.trim(),
      passwordHash,
    })

    const token = await signToken({ userId: user.id, email: user.email, name: user.name })
    const cookieStore = await cookies()
    setSessionCookie(cookieStore, token)

    return Response.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка регистрации'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
