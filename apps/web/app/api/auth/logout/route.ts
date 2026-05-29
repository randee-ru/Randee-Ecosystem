import { cookies } from 'next/headers'
import { clearSessionCookie } from '../../../../lib/auth'

export async function POST() {
  const cookieStore = await cookies()
  clearSessionCookie(cookieStore)
  return Response.json({ ok: true })
}
