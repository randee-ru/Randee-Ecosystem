import { cookies } from 'next/headers'
import { getSession } from '../../../../lib/auth'

export async function GET() {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  if (!session) {
    return Response.json({ ok: false, user: null }, { status: 401 })
  }
  return Response.json({ ok: true, user: { id: session.userId, email: session.email, name: session.name } })
}
