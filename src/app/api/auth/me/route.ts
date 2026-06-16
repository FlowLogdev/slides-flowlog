import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(_req: NextRequest) {
  const token = (await cookies()).get('sf_session')?.value
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 })

  const session = await validateSession(token)
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 })

  return NextResponse.json({ authenticated: true, email: session.email })
}
