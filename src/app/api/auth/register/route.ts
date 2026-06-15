import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '@/lib/db'
import { sendApprovalRequestToAdmins } from '@/lib/email'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = (body.email || '').trim().toLowerCase()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 })
  }

  const existing = await findUserByEmail(email)
  if (existing) {
    if (existing.status === 'approved') {
      return NextResponse.json({ status: 'approved', message: 'This email already has access. Log in below.' })
    }
    if (existing.status === 'rejected') {
      return NextResponse.json({ status: 'rejected', message: 'This request was not approved.' }, { status: 403 })
    }
    return NextResponse.json({ status: 'pending', message: 'Your request is already pending admin review.' })
  }

  const approvalToken = randomBytes(24).toString('hex')
  const user = await createUser(email, approvalToken)

  try {
    await sendApprovalRequestToAdmins(email, user.id, approvalToken)
  } catch (err) {
    console.error('[register] Failed to notify admins:', err)
  }

  return NextResponse.json({ status: 'pending', message: 'Request submitted. You will be notified by email once approved.' })
}
