import { NextRequest, NextResponse } from 'next/server'
import { createAdminSession, isAdminEmail } from '@/lib/db'
import crypto from 'crypto'

const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockoutUntil?: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000
const ATTEMPT_WINDOW = 15 * 60 * 1000

function getRateLimitKey(req: NextRequest, email: string): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown'
  return `${ip}:${email}`
}

function checkRateLimit(key: string): { allowed: boolean; lockoutUntil?: number } {
  const now = Date.now()
  const record = loginAttempts.get(key)

  if (!record) {
    return { allowed: true }
  }

  if (record.lockoutUntil && now < record.lockoutUntil) {
    return { allowed: false, lockoutUntil: record.lockoutUntil }
  }

  if (now - record.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.delete(key)
    return { allowed: true }
  }

  if (record.count >= MAX_ATTEMPTS) {
    const lockoutUntil = now + LOCKOUT_DURATION
    loginAttempts.set(key, { ...record, lockoutUntil })
    return { allowed: false, lockoutUntil }
  }

  return { allowed: true }
}

function recordAttempt(key: string, success: boolean): void {
  const now = Date.now()
  
  if (success) {
    loginAttempts.delete(key)
    return
  }

  const record = loginAttempts.get(key)
  if (!record || now - record.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.set(key, { count: 1, lastAttempt: now })
  } else {
    loginAttempts.set(key, { count: record.count + 1, lastAttempt: now })
  }
}

function timingSafePasswordCompare(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided, 'utf8')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  
  if (providedBuffer.length !== expectedBuffer.length) {
    crypto.timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32))
    return false
  }
  
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = (body.email || '').trim().toLowerCase()
  const password = (body.password || '').trim()
  const adminPassword = process.env.ADMIN_PASSWORD || ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required.' }, { status: 400 })
  }

  const rateLimitKey = getRateLimitKey(req, email)
  const rateCheck = checkRateLimit(rateLimitKey)
  
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many failed attempts. Please try again later.' }, { status: 429 })
  }

  const isValidEmail = isAdminEmail(email)
  const hasAdminPassword = !!adminPassword
  const isPasswordCorrect = hasAdminPassword && timingSafePasswordCompare(password, adminPassword)

  if (!isValidEmail || !hasAdminPassword || !isPasswordCorrect) {
    recordAttempt(rateLimitKey, false)
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  recordAttempt(rateLimitKey, true)
  
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
