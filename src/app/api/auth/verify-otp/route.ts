import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, verifyOTP, createSession } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = (body.email || '').trim().toLowerCase()
  const code = (body.code || '').trim()

  if (!email || !code) {
    return NextResponse.json({ error: 'Email and code required.' }, { status: 400 })
  }

  const user = await findUserByEmail(email)
  if (!user || user.status !== 'approved') {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const valid = await verifyOTP(email, code)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 401 })
  }

  const sessionToken = await createSession(email)

  const response = NextResponse.json({ success: true, email })
  response.cookies.set('sf_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}
