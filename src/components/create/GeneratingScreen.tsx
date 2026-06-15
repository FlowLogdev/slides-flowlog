'use client'
// src/components/create/GeneratingScreen.tsx
import { useEffect, useState } from 'react'
import { Screen } from '@/components/AppShell'
import { useStore } from '@/lib/store'

interface Props { onNavigate: (s: Screen) => void }

const STEPS = [
  { label: 'Analyzing your content',      sub: 'Understanding structure and intent'            },
  { label: 'Structuring the deck',         sub: 'Creating a logical narrative flow'             },
  { label: 'Writing slide content',        sub: 'Crafting compelling copy with Claude AI'       },
  { label: 'Generating slide images',      sub: 'Creating visuals with DALL-E 3 · takes ~30s'  },
  { label: 'Finalizing your presentation', sub: 'Applying theme, fonts and layout'              },
]

export default function GeneratingScreen({ onNavigate }: Props) {
  const { loadingStep, presentation } = useStore()
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(t)
  }, [])

  const current = STEPS[Math.min(loadingStep - 1, STEPS.length - 1)] || STEPS[0]
  const progress = Math.round((loadingStep / STEPS.length) * 100)

  return (
    <div style={{
      minHeight: 'calc(100vh - 57px)', background: '#0d0f0e',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32,
    }}>
      {/* Animated logo */}
      <div style={{ marginBottom: 40, position: 'relative' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, background: 'rgba(10,207,131,0.12)',
          border: '2px solid rgba(10,207,131,0.3)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 30, animation: 'breathe 2s ease-in-out infinite',
        }}>✦</div>
        <div style={{
          position: 'absolute', inset: -8, borderRadius: 28,
          border: '2px solid rgba(10,207,131,0.15)',
          animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        }}></div>
      </div>

      {/* Current step label */}
      <div style={{ textAlign: 'center', marginBottom: 32, maxWidth: 440 }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: '#f5f7f6', marginBottom: 8, letterSpacing: '-0.3px' }}>
          {current.label}{dots}
        </h2>
        <p style={{ fontSize: 14, color: '#6b6e6c', fontWeight: 300 }}>{current.sub}</p>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 400, marginBottom: 40 }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 100, height: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: 'linear-gradient(90deg,#0ACF83,#08a869)',
            borderRadius: 100, width: `${progress}%`,
            transition: 'width 0.8s ease',
          }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#6b6e6c' }}>
          <span>Step {Math.min(loadingStep, STEPS.length)} of {STEPS.length}</span>
          <span style={{ color: '#0ACF83', fontWeight: 600 }}>{progress}%</span>
        </div>
      </div>

      {/* Step list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 400 }}>
        {STEPS.map((step, i) => {
          const done    = i < loadingStep - 1
          const active  = i === loadingStep - 1
          const pending = i > loadingStep - 1
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: pending ? 0.3 : 1,
              transition: 'opacity .4s',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${done ? '#0ACF83' : active ? '#0ACF83' : 'rgba(255,255,255,0.15)'}`,
                background: done ? '#0ACF83' : active ? 'rgba(10,207,131,0.12)' : 'transparent',
                fontSize: 12, color: done ? 'white' : active ? '#0ACF83' : '#6b6e6c',
                transition: 'all .3s',
              }}>
                {done ? '✓' : active ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>◌</span> : i + 1}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: done || active ? 500 : 400, color: done ? '#9ba09d' : active ? '#f5f7f6' : '#6b6e6c' }}>{step.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes ping { 75%,100%{transform:scale(1.4);opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
