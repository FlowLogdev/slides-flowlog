import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, approveUser, rejectUser } from '@/lib/db'
import { sendAccessApproved } from '@/lib/email'
import { timingSafeEqual } from 'crypto'

function authorized(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key') || ''
  const pw = process.env.ADMIN_PASSWORD || ''
  
  if (pw.length === 0) {
    throw new Error('ADMIN_PASSWORD must be set in environment variables')
  }
  
  if (key.length !== pw.length) {
    return false
  }
  
  const keyBuffer = Buffer.from(key, 'utf8')
  const pwBuffer = Buffer.from(pw, 'utf8')
  
  return timingSafeEqual(keyBuffer, pwBuffer)
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const users = await getAllUsers()
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId, action } = await req.json().catch(() => ({}))
  if (!userId || !action) return NextResponse.json({ error: 'userId and action required' }, { status: 400 })

  if (action === 'approve') {
    const admins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
    const adminEmail = admins[0] || ''
    const user = await approveUser(userId, adminEmail)
    if (user?.status === 'approved') {
      await sendAccessApproved(user.email).catch(() => {})
    }
    return NextResponse.json({ user })
  }

  if (action === 'reject') {
    await rejectUser(userId)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
