'use client'
// src/components/home/HomeScreen.tsx
import { Screen } from '@/components/AppShell'
import { useStore } from '@/lib/store'
import { BUILTIN_TEMPLATES } from '@/lib/templates'
import { Presentation, CreationMode } from '@/lib/types'

interface Props { onNavigate: (s: Screen) => void
  onCreate: (m: import('@/lib/types').CreationMode) => void }

export default function HomeScreen({ onNavigate, onCreate }: Props) {
  const { savedPresentations, loadPresentation, deletePresentation } = useStore()

  function openTemplate(templateId: string) {
    const tmpl = BUILTIN_TEMPLATES.find(t => t.id === templateId)
    if (!tmpl) return
    const pres: Presentation = {
      id: Math.random().toString(36).slice(2),
      title: tmpl.name + ' Presentation',
      slides: tmpl.sampleSlides.map((s, i) => ({ ...s, id: String(i) })),
      theme: tmpl.theme,
      accent: tmpl.accent,
      font: tmpl.font,
      template: tmpl.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    useStore.getState().setPresentation(pres)
    onNavigate('editor')
  }

  function openSaved(id: string) {
    loadPresentation(id)
    onNavigate('editor')
  }

  const isPinvestTheme = (theme: string) => theme === 'pinvest' || theme === 'pinvest-white'

  return (
    <div>
      {/* HERO */}
      <div style={{ textAlign: 'center', padding: '72px 32px 56px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(10,207,131,0.1)', border: '1px solid rgba(10,207,131,0.25)',
          borderRadius: 100, padding: '5px 14px', fontSize: 12.5, fontWeight: 500,
          color: 'var(--brand-dim)', marginBottom: 28
        }}>
          <span style={{ width: 6, height: 6, background: 'var(--brand)', borderRadius: '50%', animation: 'pulse 2s infinite', display: 'inline-block' }}></span>
          Powered by Claude AI
        </div>
        <h1 style={{
          fontFamily: 'var(--font-head)', fontSize: 'clamp(36px,5vw,58px)',
          fontWeight: 800, lineHeight: 1.08, letterSpacing: '-1.5px',
          color: 'var(--ink)', maxWidth: 700, margin: '0 auto 18px'
        }}>
          Presentations that<br /><em style={{ fontStyle: 'normal', color: 'var(--brand)' }}>command the room</em>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink3)', maxWidth: 480, margin: '0 auto 52px', lineHeight: 1.6, fontWeight: 300 }}>
          Generate stunning, export-ready slide decks from a single prompt.
        </p>
      </div>

      {/* CREATE CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, maxWidth: 960, margin: '0 auto', padding: '0 32px' }}>
        {[
          { icon: '✦', bg: 'linear-gradient(135deg,#0d0f0e,#1a2e26)', title: 'Generate', desc: 'Type a prompt — AI builds your deck', action: () => onCreate('generate') },
          { icon: '📋', bg: 'linear-gradient(135deg,#1a1a2e,#2d1b69)', title: 'Paste text', desc: 'Turn notes into slides instantly', action: () => onCreate('generate') },
          { icon: '›', bg: 'linear-gradient(135deg,#0d1120,#1a2a4a)', title: 'Pinvest Templates', desc: 'White & Black brand decks', action: () => onCreate('template'), badge: 'Custom' },
          { icon: '↑', bg: 'linear-gradient(135deg,#1a1a1a,#3d3d3d)', title: 'Import', desc: 'Enhance existing docs or slides', action: () => onCreate('import') },
        ].map((card, i) => (
          <div key={i} onClick={card.action} style={{
            background: 'white', border: '1px solid var(--border2)', borderRadius: 18,
            cursor: 'pointer', overflow: 'hidden', transition: 'all .2s', position: 'relative'
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--brand)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(10,207,131,0.12)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
          >
            {(card as any).badge && (
              <div style={{ position: 'absolute', top: 12, right: 12, background: '#f5c800', color: '#1a3a6b', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 100 }}>
                {(card as any).badge}
              </div>
            )}
            <div style={{ height: 140, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: card.icon === '›' ? 56 : 44, color: card.icon === '›' ? '#f5c800' : 'white', fontWeight: 900 }}>
              {card.icon}
            </div>
            <div style={{ padding: '16px 18px 20px' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>{card.title}</div>
              <div style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.5 }}>{card.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TEMPLATES SECTION */}
      <div style={{ maxWidth: 960, margin: '64px auto 0', padding: '0 32px' }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>Templates</h2>
        <p style={{ color: 'var(--ink3)', fontSize: 14, marginBottom: 24, fontWeight: 300 }}>Start from a professionally designed layout</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {BUILTIN_TEMPLATES.map(tmpl => {
            const isBlack = tmpl.id === 'pinvest-black' || tmpl.id === 'pinvest'
            const isWhite = tmpl.id === 'pinvest-white'
            const isPinvestTmpl = isBlack || isWhite
            const slideBg = isBlack ? '#0d1120' : isWhite ? '#ffffff' : tmpl.theme === 'dark' ? '#0d0f0e' : tmpl.theme === 'gradient' ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#fafafa'
            const titleCol = isBlack ? '#ffffff' : isWhite ? '#1a3a6b' : ['dark','gradient'].includes(tmpl.theme) ? '#f5f7f6' : '#0d0f0e'

            return (
              <div key={tmpl.id} onClick={() => openTemplate(tmpl.id)} style={{
                border: '1px solid var(--border2)', borderRadius: 14, cursor: 'pointer',
                overflow: 'hidden', transition: 'all .2s',
                background: isBlack ? '#0d1120' : 'white',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = tmpl.accent; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
              >
                {/* Mini slide preview */}
                <div style={{ height: 100, background: slideBg, padding: '10px 12px', position: 'relative', overflow: 'hidden' }}>
                  {/* Top accent rule */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: tmpl.accent }}></div>
                  {/* Pinvest logo mark top-right */}
                  {isPinvestTmpl && (
                    <div style={{ position: 'absolute', top: 6, right: 8, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <span style={{ fontSize: 7, fontWeight: 700, color: isBlack ? '#ffffff' : '#1a3a6b', fontFamily: 'Cormorant Garamond, serif' }}>Pinvest</span>
                      <span style={{ fontSize: 9, color: '#f5c800', fontWeight: 900 }}>›</span>
                    </div>
                  )}
                  {/* Grid overlay for black */}
                  {isBlack && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg,rgba(245,200,0,0.03) 0 1px,transparent 1px 40px),repeating-linear-gradient(0deg,rgba(245,200,0,0.03) 0 1px,transparent 1px 40px)' }}></div>}
                  {/* Left nav rule for white */}
                  {isWhite && <div style={{ position: 'absolute', left: 0, top: 16, bottom: 16, width: 2, background: '#1a3a6b' }}></div>}
                  <div style={{ width: 20, height: 2, background: tmpl.accent, borderRadius: 1, marginBottom: 6, position: 'relative', marginTop: 4 }}></div>
                  <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 5, position: 'relative', color: titleCol, fontFamily: isPinvestTmpl ? 'Cormorant Garamond, serif' : 'Syne, sans-serif' }}>
                    {tmpl.sampleSlides[0]?.title}
                  </div>
                  {[1,2].map(j => (
                    <div key={j} style={{
                      height: 1.5, borderRadius: 1, marginBottom: 4, position: 'relative',
                      background: isBlack ? 'rgba(255,255,255,0.12)' : isWhite ? 'rgba(26,58,107,0.15)' : 'rgba(0,0,0,0.1)',
                      width: j === 1 ? '78%' : '55%'
                    }}></div>
                  ))}
                  {/* Footer bar preview */}
                  {isPinvestTmpl && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 10, background: isBlack ? 'rgba(0,0,0,0.5)' : '#1a3a6b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 6, height: 6, background: '#f5c800', borderRadius: '50%' }}></div></div>}
                </div>
                {/* Card footer */}
                <div style={{ padding: '10px 12px 12px', background: isBlack ? '#111520' : 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: isPinvestTmpl ? 'Cormorant Garamond, serif' : 'var(--font-head)', color: isBlack ? '#ffffff' : 'var(--ink)' }}>{tmpl.name}</span>
                    {tmpl.isCustom && <span style={{ fontSize: 10, background: tmpl.accent, color: isBlack ? '#0d1120' : isPinvestTmpl ? '#1a3a6b' : 'white', padding: '1px 6px', borderRadius: 100, fontWeight: 700 }}>Custom</span>}
                  </div>
                  <div style={{ fontSize: 11, color: isBlack ? '#6b7280' : 'var(--ink4)', lineHeight: 1.4 }}>{tmpl.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SAVED PRESENTATIONS */}
      {savedPresentations.length > 0 && (
        <div style={{ maxWidth: 960, margin: '48px auto 80px', padding: '0 32px' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>Recent</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {savedPresentations.slice(0, 8).map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '12px 16px', cursor: 'pointer', transition: 'border .15s'
              }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--brand)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
              >
                <div style={{ width: 40, height: 26, background: p.theme === 'pinvest' ? '#0d1120' : p.theme === 'pinvest-white' ? 'white' : p.theme === 'dark' ? '#1a1d1b' : 'white', borderRadius: 4, border: `2px solid ${p.accent || 'var(--brand)'}`, flexShrink: 0 }}></div>
                <div style={{ flex: 1 }} onClick={() => openSaved(p.id)}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink4)' }}>{p.slides.length} slides · {p.theme} · {new Date(p.updatedAt).toLocaleDateString()}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deletePresentation(p.id) }}
                  style={{ background: 'none', border: 'none', color: 'var(--ink4)', fontSize: 18, padding: 4, cursor: 'pointer' }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
