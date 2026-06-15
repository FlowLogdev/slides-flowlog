import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(_req: NextRequest) {
  const cookieStore = cookies()
  const token = cookieStore.get('sf_session')?.value

  if (token) {
    await deleteSession(token).catch(() => {})
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('sf_session', '', { maxAge: 0, path: '/' })
  return response
}
