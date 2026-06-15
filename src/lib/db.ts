// src/lib/db.ts
// File-based JSON database. Works for local development.
// For Vercel deployment, swap the getDB/saveDB functions to use Vercel KV or Supabase.
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'users.json')

export interface User {
  id: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: number
  approvedAt?: number
  rejectedAt?: number
  approvals: string[]
  approvalToken: string
}

interface OTPToken {
  email: string
  code: string
  expiresAt: number
}

interface Session {
  token: string
  email: string
  expiresAt: number
}

interface Database {
  users: User[]
  otpTokens: OTPToken[]
  sessions: Session[]
}

async function getDB(): Promise<Database> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
  if (!existsSync(DB_FILE)) {
    const empty: Database = { users: [], otpTokens: [], sessions: [] }
    await writeFile(DB_FILE, JSON.stringify(empty, null, 2), 'utf8')
    return empty
  }
  const raw = await readFile(DB_FILE, 'utf8')
  return JSON.parse(raw) as Database
}

async function saveDB(db: Database): Promise<void> {
  await writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8')
}

function requiredAdmins(): string[] {
  return (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
}

function createApprovedAdmin(email: string): User {
  return {
    id: randomBytes(12).toString('hex'),
    email,
    status: 'approved',
    requestedAt: Date.now(),
    approvedAt: Date.now(),
    approvals: requiredAdmins(),
    approvalToken: randomBytes(24).toString('hex'),
  }
}

async function ensureLocalAdmins(db: Database): Promise<boolean> {
  const admins = requiredAdmins()
  let changed = false

  for (const email of admins) {
    const existing = db.users.find(u => u.email === email)
    if (!existing) {
      db.users.push(createApprovedAdmin(email))
      changed = true
      continue
    }

    if (existing.status !== 'approved') {
      existing.status = 'approved'
      existing.approvedAt = existing.approvedAt ?? Date.now()
      existing.approvals = Array.from(new Set([...existing.approvals, ...admins]))
      changed = true
    }
  }

  return changed
}

export async function createUser(email: string, approvalToken: string): Promise<User> {
  const db = await getDB()
  const existing = db.users.find(u => u.email === email)
  if (existing) return existing

  const user: User = {
    id: randomBytes(12).toString('hex'),
    email,
    status: 'pending',
    requestedAt: Date.now(),
    approvals: [],
    approvalToken,
  }
  db.users.push(user)
  await saveDB(db)
  return user
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDB()
  if (await ensureLocalAdmins(db)) {
    await saveDB(db)
  }
  return db.users.find(u => u.email === email.toLowerCase()) ?? null
}

export async function findUserByApprovalToken(token: string): Promise<User | null> {
  const db = await getDB()
  return db.users.find(u => u.approvalToken === token) ?? null
}

export async function approveUser(userId: string, adminEmail: string): Promise<User | null> {
  const db = await getDB()
  const user = db.users.find(u => u.id === userId)
  if (!user) return null

  if (!user.approvals.includes(adminEmail)) {
    user.approvals.push(adminEmail)
  }

  const admins = requiredAdmins()
  const allApproved = admins.length > 0 && admins.every(a => user.approvals.includes(a))
  if (allApproved) {
    user.status = 'approved'
    user.approvedAt = Date.now()
  }

  await saveDB(db)
  return user
}

export async function rejectUser(userId: string): Promise<void> {
  const db = await getDB()
  const user = db.users.find(u => u.id === userId)
  if (user) {
    user.status = 'rejected'
    user.rejectedAt = Date.now()
    await saveDB(db)
  }
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDB()
  if (await ensureLocalAdmins(db)) {
    await saveDB(db)
  }
  return db.users
}

export async function createOTP(email: string): Promise<string> {
  const db = await getDB()
  db.otpTokens = db.otpTokens.filter(t => t.email !== email)
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  db.otpTokens.push({ email, code, expiresAt: Date.now() + 15 * 60 * 1000 })
  await saveDB(db)
  return code
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  const db = await getDB()
  const token = db.otpTokens.find(t => t.email === email && t.code === code)
  if (!token || Date.now() > token.expiresAt) return false
  db.otpTokens = db.otpTokens.filter(t => !(t.email === email && t.code === code))
  await saveDB(db)
  return true
}

export async function createSession(email: string): Promise<string> {
  const db = await getDB()
  const token = randomBytes(32).toString('hex')
  db.sessions.push({ token, email, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  db.sessions = db.sessions.filter(s => s.expiresAt > Date.now())
  await saveDB(db)
  return token
}

export async function validateSession(token: string): Promise<{ email: string } | null> {
  const db = await getDB()
  const session = db.sessions.find(s => s.token === token && s.expiresAt > Date.now())
  return session ? { email: session.email } : null
}

export async function deleteSession(token: string): Promise<void> {
  const db = await getDB()
  db.sessions = db.sessions.filter(s => s.token !== token)
  await saveDB(db)
}
