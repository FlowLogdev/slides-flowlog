'use client'
// src/components/generate/LoadingScreen.tsx
import { useEffect } from 'react'
import { Screen } from '@/components/AppShell'
import { useStore } from '@/lib/store'

interface Props { onNavigate: (s: Screen) => void }

const STEPS = [
  'Analyzing your prompt',
  'Structuring slide flow',
  'Writing slide content',
  'Applying design theme',
]

export default function LoadingScreen({ onNavigate: _onNavigate }: Props) {
  const { loadingStep, presentation } = useStore()

  useEffect(() => {
    if (presentation && loadingStep >= 4) {
      // Editor navigation handled by GenerateScreen
    }
  }, [presentation, loadingStep])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 57px)', gap: 28 }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: '3px solid var(--border)',
        borderTopColor: 'var(--brand)',
        animation: 'spin 0.8s linear infinite',
      }}></div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700 }}>Building your presentation…</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
        {STEPS.map((step, i) => {
          const isDone = loadingStep > i + 1
          const isActive = loadingStep === i + 1
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 14, opacity: isDone ? 0.7 : isActive ? 1 : 0.35,
              color: isDone ? 'var(--brand-dim)' : isActive ? 'var(--ink)' : 'var(--ink3)',
              transition: 'all .4s',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${isDone ? 'var(--brand)' : isActive ? 'var(--brand)' : 'var(--border2)'}`,
                background: isDone ? 'var(--brand)' : isActive ? 'var(--brand-glow)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: isDone ? 'white' : 'inherit',
              }}>
                {isDone ? '✓' : i + 1}
              </div>
              {step}
            </div>
          )
        })}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
