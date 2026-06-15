import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, approveUser, rejectUser } from '@/lib/db'
import { sendAccessApproved } from '@/lib/email'

function authorized(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key') || ''
  const pw = process.env.ADMIN_PASSWORD || ''
  return pw.length > 0 && key === pw
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
    let user = null
    for (const a of admins) {
      user = await approveUser(userId, a)
    }
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
