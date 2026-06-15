'use client'
import { useState, useEffect } from 'react'
import type { User } from '@/lib/db'

const navy = '#080b15'
const card = '#0d1120'
const gold = '#f5c800'
const border = 'rgba(245,200,0,0.12)'
const muted = '#8a8f98'

export default function AdminPage() {
  const [key, setKey] = useState('')
  const [entered, setEntered] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function loadUsers(adminKey: string) {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/users', { headers: { 'x-admin-key': adminKey } })
    if (!res.ok) { setError('Incorrect password.'); setLoading(false); return }
    const data = await res.json()
    setUsers(data.users || [])
    setEntered(true)
    setLoading(false)
  }

  async function doAction(userId: string, action: 'approve' | 'reject') {
    setMsg('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({ userId, action }),
    })
    if (!res.ok) { setMsg('Action failed.'); return }
    setMsg(action === 'approve' ? 'Approved and notified.' : 'Rejected.')
    loadUsers(key)
  }

  const statusColor = (s: User['status']) =>
    s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : gold

  if (!entered) {
    return (
      <div style={{ background: navy, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ height: 3, background: gold, marginBottom: 32, borderRadius: 1 }} />
          <p style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.22em', color: gold, textTransform: 'uppercase', marginBottom: 20 }}>SLIDES.FLOWLOG</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: '#ffffff', marginBottom: 28, letterSpacing: '-0.3px' }}>Admin Panel</h1>
          <input
            type="password"
            placeholder="Admin password"
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadUsers(key)}
            style={{ width: '100%', background: card, border: `1px solid ${border}`, borderRadius: 8, padding: '13px 16px', color: '#ffffff', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', marginBottom: 12 }}
            autoFocus
          />
          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button
            onClick={() => loadUsers(key)}
            disabled={loading}
            style={{ width: '100%', background: gold, color: navy, border: 'none', borderRadius: 8, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.02em' }}
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </div>
      </div>
    )
  }

  const pending = users.filter(u => u.status === 'pending')
  const approved = users.filter(u => u.status === 'approved')
  const rejected = users.filter(u => u.status === 'rejected')

  return (
    <div style={{ background: navy, minHeight: '100vh', padding: '0 0 80px' }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${border}`, padding: '0 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.2em', color: gold }}>SLIDES.FLOWLOG</span>
            <span style={{ color: border, fontSize: 16 }}>/</span>
            <span style={{ color: muted, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Admin</span>
          </div>
          <button onClick={() => setEntered(false)} style={{ background: 'none', border: `1px solid ${border}`, color: muted, padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Lock
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px' }}>
        {msg && (
          <div style={{ background: 'rgba(245,200,0,0.07)', border: `1px solid ${border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 24, color: gold, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            {msg}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 40 }}>
          {[
            { label: 'Pending', count: pending.length, color: gold },
            { label: 'Approved', count: approved.length, color: '#22c55e' },
            { label: 'Rejected', count: rejected.length, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: '20px 22px' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'Cormorant Garamond', serif", marginBottom: 4 }}>{s.count}</div>
              <div style={{ fontSize: 11, color: muted, fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pending requests */}
        {pending.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: gold, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Pending Approval</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pending.map(u => (
                <UserRow key={u.id} user={u} statusColor={statusColor} onApprove={() => doAction(u.id, 'approve')} onReject={() => doAction(u.id, 'reject')} gold={gold} border={border} />
              ))}
            </div>
          </div>
        )}

        {/* All users */}
        <div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>All Users</h2>
          {users.length === 0 && <p style={{ color: muted, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>No users yet.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map(u => (
              <UserRow key={u.id} user={u} statusColor={statusColor} onApprove={() => doAction(u.id, 'approve')} onReject={() => doAction(u.id, 'reject')} gold={gold} border={border} compact />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function UserRow({ user, statusColor, onApprove, onReject, gold, border, compact }: {
  user: User
  statusColor: (s: User['status']) => string
  onApprove: () => void
  onReject: () => void
  gold: string
  border: string
  compact?: boolean
}) {
  const card = '#0d1120'
  const muted = '#8a8f98'
  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#ffffff', marginBottom: 3 }}>{user.email}</div>
        <div style={{ fontSize: 11, color: muted, fontFamily: 'monospace', display: 'flex', gap: 12 }}>
          <span style={{ color: statusColor(user.status), textTransform: 'uppercase', letterSpacing: '0.08em' }}>{user.status}</span>
          <span>{new Date(user.requestedAt).toLocaleDateString()}</span>
          {user.approvals.length > 0 && <span>Approvals: {user.approvals.join(', ')}</span>}
        </div>
      </div>
      {user.status === 'pending' && !compact && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={onApprove} style={{ background: gold, color: '#080b15', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Approve</button>
          <button onClick={onReject} style={{ background: 'none', border: `1px solid rgba(239,68,68,0.4)`, color: '#ef4444', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Reject</button>
        </div>
      )}
    </div>
  )
}
