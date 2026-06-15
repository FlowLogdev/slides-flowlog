'use client'
import { useState, useRef } from 'react'

type Mode = 'landing' | 'pending' | 'login-email' | 'login-otp' | 'login-password'

export default function LandingPage() {
  const [mode, setMode] = useState<Mode>('landing')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes('@')) { setError('Enter a valid email.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (data.status === 'approved') {
        setStatusMsg(data.message)
        setMode('login-email')
      } else if (data.status === 'rejected') {
        setError(data.message)
      } else if (data.error) {
        setError(data.error)
      } else {
        setMode('pending')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('Enter your email.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setMode('login-otp')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!otp) { setError('Enter the code.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: otp.trim() }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      window.location.reload()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Enter your admin email and password.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/password-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      window.location.reload()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#080b15', minHeight: '100vh', color: '#d4cfc8', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── TOP RULE ── */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #f5c800 0%, #d4a800 60%, transparent 100%)' }} />

      {/* ── NAV ── */}
      <nav style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, background: '#f5c800', borderRadius: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="#080b15">
              <path d="M8 2L14 13H2L8 2Z" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 17, color: '#ffffff', letterSpacing: '-0.2px' }}>
            slides<span style={{ color: '#f5c800' }}>.flowlog</span>
          </span>
        </div>

        <button
          onClick={() => { setMode('login-password'); setError('') }}
          style={{ background: 'none', border: '1px solid rgba(245,200,0,0.25)', color: '#f5c800', borderRadius: 7, padding: '8px 18px', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, letterSpacing: '0.01em', transition: 'all .15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,200,0,0.08)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
        >
          Log In
        </button>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '80px 32px 64px', textAlign: 'center' }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(245,200,0,0.07)', border: '1px solid rgba(245,200,0,0.2)',
          borderRadius: 100, padding: '6px 16px', marginBottom: 36,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f5c800', display: 'inline-block' }} />
          <span style={{ fontSize: 11.5, fontFamily: 'monospace', letterSpacing: '0.16em', color: '#c8a430', textTransform: 'uppercase' }}>
            Private Access · Pinvest LLC
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(44px, 7vw, 76px)',
          fontWeight: 600, lineHeight: 1.05, letterSpacing: '-1px',
          color: '#ffffff', margin: '0 auto 12px',
        }}>
          Decks that{' '}
          <em style={{ fontStyle: 'italic', color: '#f5c800' }}>move capital.</em>
        </h1>

        {/* Sub */}
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#8a8f98', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 52px', fontWeight: 300 }}>
          slides.flowlog generates institutional-grade presentations in seconds.
          Powered by Claude AI, styled for the boardroom.
        </p>

        {/* ── FORM AREA ── */}
        {mode === 'landing' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', gap: 10, maxWidth: 480, margin: '0 auto', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                ref={emailRef}
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                style={{
                  flex: 1, background: '#0d1120', border: '1px solid rgba(245,200,0,0.16)',
                  borderRadius: 8, padding: '14px 18px', color: '#ffffff', fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif", outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,200,0,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(245,200,0,0.16)')}
              />
              <button type="submit" disabled={loading} style={{
                background: '#f5c800', color: '#080b15', border: 'none', borderRadius: 8,
                padding: '14px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {loading ? '…' : 'Request Access'}
              </button>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'left', margin: 0 }}>{error}</p>}
            <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>
              Access is by administrator approval only.
            </p>
          </form>
        )}

        {mode === 'pending' && (
          <div style={{ maxWidth: 480, margin: '0 auto', background: '#0d1120', border: '1px solid rgba(245,200,0,0.18)', borderRadius: 12, padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245,200,0,0.1)', border: '1px solid rgba(245,200,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span style={{ fontSize: 20 }}>⏳</span>
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: '#ffffff', marginBottom: 10 }}>Request submitted</h3>
            <p style={{ color: '#8a8f98', fontSize: 14, lineHeight: 1.65, marginBottom: 20 }}>
              Your request for <strong style={{ color: '#c8d0e0' }}>{email}</strong> is pending review.
              Both administrators must approve before you receive access.
              You will be notified by email.
            </p>
            <div style={{ height: 1, background: 'rgba(245,200,0,0.1)', margin: '0 0 20px' }} />
            <p style={{ fontSize: 12, color: '#4b5563' }}>Already approved? <button onClick={() => setMode('login-email')} style={{ background: 'none', border: 'none', color: '#f5c800', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif", textDecoration: 'underline' }}>Log in instead</button></p>
          </div>
        )}

        {mode === 'login-email' && (
          <form onSubmit={handleRequestOTP} style={{ display: 'flex', gap: 10, maxWidth: 480, margin: '0 auto', flexDirection: 'column' }}>
            <p style={{ color: '#8a8f98', fontSize: 14, textAlign: 'left', marginBottom: 4 }}>
              {statusMsg || 'Enter your approved email to receive a login code.'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                autoFocus
                style={{
                  flex: 1, background: '#0d1120', border: '1px solid rgba(245,200,0,0.16)',
                  borderRadius: 8, padding: '14px 18px', color: '#ffffff', fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif", outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,200,0,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(245,200,0,0.16)')}
              />
              <button type="submit" disabled={loading} style={{
                background: '#f5c800', color: '#080b15', border: 'none', borderRadius: 8,
                padding: '14px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {loading ? '…' : 'Send Code'}
              </button>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'left' }}>{error}</p>}
            <p style={{ fontSize: 12, color: '#4b5563' }}>
              Don't have access yet?{' '}
              <button type="button" onClick={() => { setMode('landing'); setError('') }} style={{ background: 'none', border: 'none', color: '#f5c800', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif", textDecoration: 'underline' }}>
                Request it
              </button>
            </p>
          </form>
        )}

        {mode === 'login-password' && (
          <form onSubmit={handlePasswordLogin} style={{ display: 'flex', gap: 10, maxWidth: 480, margin: '0 auto', flexDirection: 'column' }}>
            <p style={{ color: '#8a8f98', fontSize: 14, textAlign: 'left', marginBottom: 4 }}>
              Admin access
            </p>
            <input
              type="email"
              placeholder="Admin email address"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              autoFocus
              style={{
                background: '#0d1120', border: '1px solid rgba(245,200,0,0.16)',
                borderRadius: 8, padding: '14px 18px', color: '#ffffff', fontSize: 14,
                fontFamily: "'DM Sans', sans-serif", outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,200,0,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(245,200,0,0.16)')}
            />
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              style={{
                background: '#0d1120', border: '1px solid rgba(245,200,0,0.16)',
                borderRadius: 8, padding: '14px 18px', color: '#ffffff', fontSize: 14,
                fontFamily: "'DM Sans', sans-serif", outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,200,0,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(245,200,0,0.16)')}
            />
            <button type="submit" disabled={loading} style={{
              background: '#f5c800', color: '#080b15', border: 'none', borderRadius: 8,
              padding: '14px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
            }}>
              {loading ? '...' : 'Log In'}
            </button>
            {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'left' }}>{error}</p>}
            <p style={{ fontSize: 12, color: '#4b5563' }}>
              Approved non-admin user?{' '}
              <button type="button" onClick={() => { setMode('login-email'); setError('') }} style={{ background: 'none', border: 'none', color: '#f5c800', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif", textDecoration: 'underline' }}>
                Use email code
              </button>
            </p>
          </form>
        )}

        {mode === 'login-otp' && (
          <form onSubmit={handleVerifyOTP} style={{ display: 'flex', gap: 10, maxWidth: 480, margin: '0 auto', flexDirection: 'column' }}>
            <p style={{ color: '#8a8f98', fontSize: 14, textAlign: 'left', marginBottom: 4 }}>
              A 6-digit code was sent to <strong style={{ color: '#c8d0e0' }}>{email}</strong>. Enter it below.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                autoFocus
                inputMode="numeric"
                style={{
                  flex: 1, background: '#0d1120', border: '1px solid rgba(245,200,0,0.16)',
                  borderRadius: 8, padding: '14px 18px', color: '#f5c800', fontSize: 22,
                  fontFamily: 'monospace', letterSpacing: '0.3em', outline: 'none', textAlign: 'center',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,200,0,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(245,200,0,0.16)')}
              />
              <button type="submit" disabled={loading || otp.length < 6} style={{
                background: otp.length === 6 ? '#f5c800' : 'rgba(245,200,0,0.2)',
                color: '#080b15', border: 'none', borderRadius: 8,
                padding: '14px 24px', fontSize: 14, fontWeight: 700, cursor: otp.length === 6 ? 'pointer' : 'default',
                fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', flexShrink: 0, transition: 'background .2s',
              }}>
                {loading ? '…' : 'Log In'}
              </button>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'left' }}>{error}</p>}
            <p style={{ fontSize: 12, color: '#4b5563' }}>
              <button type="button" onClick={() => { setMode('login-email'); setOtp(''); setError('') }} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif", textDecoration: 'underline' }}>
                ← Change email
              </button>
            </p>
          </form>
        )}
      </section>

      {/* ── FEATURES ── */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 32px 96px', borderTop: '1px solid rgba(245,200,0,0.08)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 48 }}>
          {[
            {
              n: '01',
              title: 'Generate',
              body: 'Type a brief or paste your notes. Claude builds a complete, structured deck in under 90 seconds.',
            },
            {
              n: '02',
              title: 'Design',
              body: 'Pinvest brand system built in. White and black themes, Cormorant Garamond, gold accents — all yours.',
            },
            {
              n: '03',
              title: 'Export',
              body: 'PowerPoint, PDF, and HTML exports. Ready for any format, any boardroom, any device.',
            },
          ].map(f => (
            <div key={f.n}>
              <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.2em', color: '#f5c800', marginBottom: 18 }}>{f.n}</div>
              <div style={{ height: 1, background: 'rgba(245,200,0,0.25)', marginBottom: 22, width: 48 }} />
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 12, letterSpacing: '-0.2px' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, fontWeight: 300 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(245,200,0,0.06)', padding: '28px 32px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', color: 'rgba(245,200,0,0.3)', textTransform: 'uppercase' }}>
          slides.flowlog · exclusively for Pinvest LLC and approved clients · access by invitation only
        </p>
      </footer>
    </div>
  )
}
