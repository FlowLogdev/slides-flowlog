import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, createOTP } from '@/lib/db'
import { sendOTP } from '@/lib/email'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = (body.email || '').trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'Email required.' }, { status: 400 })
  }

  const user = await findUserByEmail(email)

  // Respond the same way regardless of whether the user exists or is approved
  if (!user || user.status !== 'approved') {
    return NextResponse.json({ message: 'If this email is registered and approved, a code has been sent.' })
  }

  const otp = await createOTP(email)

  try {
    await sendOTP(email, otp)
  } catch (err) {
    console.error('[request-otp] Failed to send OTP:', err)
    return NextResponse.json({ error: 'Failed to send code. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Code sent. Check your email.' })
}
