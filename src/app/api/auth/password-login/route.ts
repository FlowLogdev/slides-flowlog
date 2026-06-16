import { NextRequest, NextResponse } from 'next/server'
import { createAdminSession, isAdminEmail } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = (body.email || '').trim().toLowerCase()
  const password = (body.password || '').trim()
  const adminPassword = process.env.ADMIN_PASSWORD || ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required.' }, { status: 400 })
  }

  if (!isAdminEmail(email) || !adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const sessionToken = createAdminSession(email)
  const response = NextResponse.json({ success: true, email, role: 'admin' })
  response.cookies.set('sf_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}
