import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  // CSRF Protection: Verify request origin
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  
  if (origin) {
    const originHost = new URL(origin).host
    if (originHost !== host) {
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403 }
      )
    }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('sf_session')?.value

  if (token) {
    await deleteSession(token).catch(() => {})
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('sf_session', '', { maxAge: 0, path: '/' })
  return response
}
