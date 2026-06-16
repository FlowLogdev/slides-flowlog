'use client'
// src/components/create/GeneratingScreen.tsx
import { useEffect, useState } from 'react'
import { Screen } from '@/components/AppShell'
import { useStore } from '@/lib/store'

interface Props { onNavigate: (s: Screen) => void }

const STEPS = [
  { label: 'Analyze', sub: 'Reading the brief' },
  { label: 'Structure', sub: 'Building the story' },
  { label: 'Write', sub: 'Drafting slide copy' },
  { label: 'Visuals', sub: 'Creating backgrounds' },
  { label: 'Finish', sub: 'Opening the editor' },
]

export default function GeneratingScreen({ onNavigate }: Props) {
  const {
    loadingStep, generationPreviewSlides, generationActiveSlide,
    generationTitle, generationStatus, presentation, isGenerating,
  } = useStore()
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 450)
    return () => clearInterval(t)
  }, [])

  const active = generationPreviewSlides[generationActiveSlide] || generationPreviewSlides[0]
  const progress = Math.min(100, Math.round((Math.max(loadingStep, 1) / STEPS.length) * 100))

  return (
    <div style={{
      height: 'calc(100vh - 57px)',
      background: '#080b10',
      color: '#f5f7f6',
      display: 'grid',
      gridTemplateColumns: '280px minmax(260px, 420px) 1fr',
      overflow: 'hidden',
    }}>
      <aside style={{ borderRight: '1px solid rgba(255,255,255,0.08)', padding: 24, display: 'flex', flexDirection: 'column' }}>
        <button
          onClick={() => onNavigate('create')}
          disabled={isGenerating}
          style={{
            alignSelf: 'flex-start', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
            color: isGenerating ? '#4b5563' : '#cbd5e1', borderRadius: 8, padding: '7px 10px',
            fontSize: 12, cursor: isGenerating ? 'not-allowed' : 'pointer', marginBottom: 24,
          }}
        >
          Back
        </button>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0ACF83', marginBottom: 12 }}>
          Live generation
        </div>
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 25, lineHeight: 1.1, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          {generationTitle || presentation?.title || 'Creating your deck'}
        </h1>
        <p style={{ margin: '0 0 28px', color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
          {generationStatus || 'Preparing the first draft'}{isGenerating ? dots : ''}
        </p>

        <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden', marginBottom: 22 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#0ACF83', transition: 'width .45s ease' }} />
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {STEPS.map((step, i) => {
            const done = i < loadingStep - 1
            const current = i === loadingStep - 1
            return (
              <div key={step.label} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10, alignItems: 'center', opacity: done || current ? 1 : 0.38 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: done ? '#0ACF83' : current ? 'rgba(10,207,131,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${done || current ? '#0ACF83' : 'rgba(255,255,255,0.12)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: done ? '#07120d' : current ? '#0ACF83' : '#64748b',
                  fontSize: 12, fontWeight: 800,
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 650 }}>{step.label}</div>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>{step.sub}</div>
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      <section style={{ borderRight: '1px solid rgba(255,255,255,0.08)', padding: 18, overflowY: 'auto', background: '#0b0f16' }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{generationPreviewSlides.length || 0} slides</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {generationPreviewSlides.map((slide, i) => (
            <div key={slide.id || i} style={{
              border: `1px solid ${i === generationActiveSlide ? '#0ACF83' : 'rgba(255,255,255,0.09)'}`,
              background: i === generationActiveSlide ? 'rgba(10,207,131,0.08)' : 'rgba(255,255,255,0.035)',
              borderRadius: 8,
              padding: 10,
              aspectRatio: '16/9',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: i === generationActiveSlide ? '0 0 0 3px rgba(10,207,131,0.08)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 10, color: '#0ACF83', marginBottom: 8 }}>Slide {i + 1}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 750, lineHeight: 1.2, color: '#f8fafc' }}>
                  {slide.title || 'Untitled'}
                </div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                {(slide.content ? slide.content.split('\n') : ['']).slice(0, 3).map((line, j) => (
                  <div key={j} style={{
                    height: line ? 'auto' : 5,
                    minHeight: 5,
                    borderRadius: 99,
                    background: line ? 'transparent' : 'rgba(255,255,255,0.14)',
                    color: '#94a3b8',
                    fontSize: 8.5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <main style={{ padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{
          width: 'min(900px, 100%)',
          aspectRatio: '16/9',
          background: active?.imageUrl
            ? `linear-gradient(rgba(8,11,16,.74), rgba(8,11,16,.8)), url(${active.imageUrl}) center/cover`
            : 'radial-gradient(circle at 78% 20%, rgba(10,207,131,.22), transparent 34%), linear-gradient(135deg,#101827,#05070b)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          boxShadow: '0 28px 90px rgba(0,0,0,0.45)',
          padding: '7% 8%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#0ACF83' }} />
          <div style={{ fontSize: 12, color: '#0ACF83', marginBottom: 18, letterSpacing: '0.13em', textTransform: 'uppercase' }}>
            Slide {generationActiveSlide + 1}
          </div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(30px,4vw,56px)', lineHeight: 1.02, letterSpacing: '-0.035em', margin: '0 0 24px' }}>
            {active?.title || 'Drafting slide'}
          </h2>
          <div style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
            {(active?.content || '').split('\n').filter(Boolean).slice(0, 7).map((line, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 12, alignItems: 'start' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0ACF83', marginTop: 9 }} />
                <span style={{ color: '#dbe7e2', fontSize: 'clamp(15px,1.4vw,20px)', lineHeight: 1.48 }}>{line}</span>
              </div>
            ))}
            {!active?.content && (
              <>
                <div style={{ width: '84%', height: 15, borderRadius: 99, background: 'rgba(255,255,255,0.14)' }} />
                <div style={{ width: '62%', height: 15, borderRadius: 99, background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ width: '72%', height: 15, borderRadius: 99, background: 'rgba(255,255,255,0.08)' }} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
