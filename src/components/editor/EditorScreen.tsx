'use client'
// src/components/editor/EditorScreen.tsx
import { useStore } from '@/lib/store'
import { Screen } from '@/components/AppShell'
import { getTheme } from '@/lib/themes'
import { exportPresentation } from '@/lib/export'
import { ExportFormat, SlideLayout } from '@/lib/types'

interface Props { onNavigate: (s: Screen) => void }

const ACCENT_COLORS = ['#0ACF83','#6366f1','#f43f5e','#f5c800','#3b82f6','#8b5cf6','#1a3a6b','#e11d48']
const FONTS = ['Syne','Cormorant Garamond','Playfair Display','Space Grotesk','Montserrat','DM Sans']

const THEME_OPTIONS = [
  { id: 'light',          label: 'Light',               bg: '#ffffff',                                           accent: '#0ACF83' },
  { id: 'dark',           label: 'Dark',                bg: '#0d0f0e',                                           accent: '#0ACF83' },
  { id: 'gradient',       label: 'Gradient',            bg: 'linear-gradient(135deg,#667eea,#764ba2)',            accent: '#ffffff' },
  { id: 'minimal',        label: 'Minimal',             bg: '#fafafa',                                           accent: '#0d0f0e' },
  { id: 'pinvest-white',  label: '› Pinvest — White',   bg: '#ffffff',                                           accent: '#f5c800' },
  { id: 'pinvest',        label: '› Pinvest — Black',   bg: '#0d1120',                                           accent: '#f5c800' },
]

const LAYOUTS: { id: SlideLayout; label: string }[] = [
  { id: 'default',          label: '⬜ Title + Body'      },
  { id: 'centered',         label: '◎ Centered'           },
  { id: 'split',            label: '⬛⬜ Split'            },
  { id: 'blank',            label: '□ Blank'              },
  { id: 'pinvest-title',    label: '› Pinvest Title'      },
  { id: 'pinvest-content',  label: '› Pinvest Content'    },
  { id: 'pinvest-closing',  label: '› Pinvest Closing'    },
]

const toolBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--border2)', borderRadius: 6,
  padding: '6px 10px', fontSize: 13, color: 'var(--ink2)', cursor: 'pointer',
  fontFamily: 'var(--font-body)', transition: 'background .1s', whiteSpace: 'nowrap',
}
const propLabel: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 600, color: 'var(--ink4)',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
}
const fieldStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--border2)',
  borderRadius: 8,
  padding: '10px 11px',
  fontSize: 13,
  outline: 'none',
  color: 'var(--ink)',
  background: 'var(--surface)',
  lineHeight: 1.5,
  fontFamily: 'var(--font-body)',
}

export default function EditorScreen({ onNavigate }: Props) {
  const {
    presentation, currentSlideIndex,
    setCurrentSlide, updateSlide, addSlide, removeSlide,
    setTheme, setAccent, setFont,
    activeTab, setActiveTab,
    savePresentation,
  } = useStore()

  if (!presentation) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 57px)' }}>
        <div>
          <p style={{ marginBottom: 16, color: 'var(--ink3)' }}>No presentation loaded.</p>
          <button onClick={() => onNavigate('create')} style={{ background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>
            Create one →
          </button>
        </div>
      </div>
    )
  }

  const theme = getTheme(presentation.theme)
  const isPinvestBlack = presentation.theme === 'pinvest'
  const isPinvestWhite = presentation.theme === 'pinvest-white'
  const isPinvest = isPinvestBlack || isPinvestWhite
  const slide = presentation.slides[currentSlideIndex]
  const accent = presentation.accent || theme.accentOverride || '#0ACF83'
  const font = presentation.font || theme.fontOverride || 'Syne'
  const isCenter = ['centered','pinvest-title','pinvest-closing'].includes(slide?.layout || '')
  const navyBlue = '#1a3a6b'

  // Canvas background color
  const slideBg = isPinvestBlack ? '#0d1120' : isPinvestWhite ? '#ffffff'
    : presentation.theme === 'dark' ? '#0d0f0e'
    : presentation.theme === 'gradient' ? 'linear-gradient(135deg,#667eea,#764ba2)'
    : presentation.theme === 'minimal' ? '#fafafa' : '#ffffff'

  const titleColor = isPinvestBlack ? '#ffffff' : isPinvestWhite ? navyBlue : theme.titleColor
  const contentColor = isPinvestBlack ? '#c8cfe0' : isPinvestWhite ? '#2e4a7a' : theme.contentColor

  function handleExport(format: ExportFormat) {
    exportPresentation(presentation!, format)
  }

  function handleSave() {
    savePresentation()
    const btn = document.getElementById('save-btn')
    if (btn) { btn.textContent = '✓ Saved'; setTimeout(() => { btn.textContent = 'Save' }, 1500) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', height: 'calc(100vh - 57px)', overflow: 'hidden' }}>

      {/* ── SLIDE LIST ── */}
      <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '14px 10px', background: isPinvestBlack ? '#080a10' : 'var(--surface2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {presentation.slides.map((s, i) => (
          <div key={s.id} onClick={() => setCurrentSlide(i)} style={{
            background: isPinvestBlack ? (i === currentSlideIndex ? '#1a1e2e' : '#0d1120') : isPinvestWhite ? (i === currentSlideIndex ? '#f0f4ff' : 'white') : 'white',
            border: `2px solid ${i === currentSlideIndex ? accent : 'transparent'}`,
            borderRadius: 10, padding: 8, cursor: 'pointer', transition: 'all .15s',
            aspectRatio: '16/9', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            overflow: 'hidden', position: 'relative', minHeight: 70,
          }}>
            {isPinvest && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent }}></div>}
            <div style={{ fontFamily: `'Cormorant Garamond', serif`, fontSize: 8, fontWeight: 700, color: isPinvestBlack ? '#ffffff' : isPinvestWhite ? navyBlue : 'var(--ink)', lineHeight: 1.3, maxHeight: 32, overflow: 'hidden' }}>
              {s.title || 'Untitled'}
            </div>
            <div>
              <div style={{ height: 2, borderRadius: 1, background: accent, width: '60%' }}></div>
              <div style={{ position: 'absolute', bottom: 5, right: 7, fontSize: 9, color: isPinvestBlack ? '#6b7280' : 'var(--ink4)' }}>{i + 1}</div>
            </div>
          </div>
        ))}
        <button onClick={() => addSlide(currentSlideIndex)} style={{
          border: `1.5px dashed ${isPinvest ? 'rgba(245,200,0,0.3)' : 'var(--border2)'}`,
          background: 'none', borderRadius: 10, padding: 12, cursor: 'pointer',
          color: isPinvestBlack ? '#6b7280' : 'var(--ink3)', fontSize: 13,
          fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = accent; (e.currentTarget as HTMLButtonElement).style.color = accent }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = isPinvest ? 'rgba(245,200,0,0.3)' : 'var(--border2)'; (e.currentTarget as HTMLButtonElement).style.color = isPinvestBlack ? '#6b7280' : 'var(--ink3)' }}
        >+ Add slide</button>
      </div>

      {/* ── CANVAS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: theme.canvasBackground }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'white', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button style={toolBtn} onClick={() => setCurrentSlide(Math.max(0, currentSlideIndex - 1))}>← Prev</button>
          <span style={{ fontSize: 13, color: 'var(--ink3)', padding: '0 4px', minWidth: 60, textAlign: 'center' }}>{currentSlideIndex + 1} / {presentation.slides.length}</span>
          <button style={toolBtn} onClick={() => setCurrentSlide(Math.min(presentation.slides.length - 1, currentSlideIndex + 1))}>Next →</button>
          <div style={{ width: 1, height: 20, background: 'var(--border2)' }}></div>
          <button style={toolBtn} onClick={() => addSlide(currentSlideIndex)}>+ Slide</button>
          <button style={{ ...toolBtn, color: '#e74c3c' }} onClick={() => removeSlide(currentSlideIndex)}>× Remove</button>
          <div style={{ flex: 1 }}></div>
          <button id="save-btn" style={{ ...toolBtn, background: 'var(--surface2)' }} onClick={handleSave}>Save</button>
        </div>

        {/* Slide canvas */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{
            width: '100%', maxWidth: 900, aspectRatio: '16/9',
            borderRadius: 10, boxShadow: '0 4px 40px rgba(0,0,0,0.18)',
            overflow: 'hidden', position: 'relative',
            background: slideBg,
            display: 'flex', flexDirection: 'column',
          }}>
            {/* AI-generated image background */}
            {slide?.imageUrl && (
              <>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${slide.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', inset: 0, background: isPinvestBlack ? 'rgba(13,17,32,0.72)' : isPinvestWhite ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.45)', zIndex: 1 }}></div>
              </>
            )}
            {/* ── PINVEST DECORATIVE ELEMENTS ── */}
            {isPinvest && (
              <>
                {/* Top accent rule */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: accent, zIndex: 3 }}></div>

                {/* Subtle grid overlay — black only */}
                {isPinvestBlack && (
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg,rgba(245,200,0,0.025) 0 1px,transparent 1px 80px),repeating-linear-gradient(0deg,rgba(245,200,0,0.025) 0 1px,transparent 1px 80px)', pointerEvents: 'none', zIndex: 0 }}></div>
                )}

                {/* Pinvest Logo — top right */}
                <div style={{ position: 'absolute', top: 14, right: 20, zIndex: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {/* "Pinvest" text in brand navy or white */}
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 700, fontSize: 13,
                    color: isPinvestWhite ? navyBlue : '#ffffff',
                    letterSpacing: '0.02em',
                  }}>Pinvest</span>
                  {/* Yellow chevron › */}
                  <span style={{ color: '#f5c800', fontSize: 16, fontWeight: 900, lineHeight: 1, marginTop: -1 }}>›</span>
                </div>

                {/* Footer bar */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 22,
                  background: isPinvestWhite ? navyBlue : 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 20px', zIndex: 3,
                }}>
                  <span style={{ fontSize: 7, letterSpacing: '0.2em', color: isPinvestWhite ? '#f5c800' : '#f5c800', fontFamily: 'monospace', opacity: 0.9 }}>
                    PINVEST LLC  ›  CONFIDENTIAL
                  </span>
                  <span style={{ fontSize: 7, color: '#f5c800', fontFamily: 'monospace' }}>
                    {currentSlideIndex + 1} / {presentation.slides.length}
                  </span>
                </div>
              </>
            )}

            {/* ── SLIDE CONTENT ── */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              padding: isPinvest ? '28px 48px 30px' : '44px 56px',
              paddingTop: isPinvest ? '28px' : '44px',
              alignItems: isCenter ? 'center' : 'flex-start',
              justifyContent: isCenter ? 'center' : 'flex-start',
              textAlign: isCenter ? 'center' : 'left',
              position: 'relative', zIndex: 1,
              marginBottom: isPinvest ? 22 : 0,
            }}>
              {/* Left navy rule (Pinvest White only, non-centered) */}
              {isPinvestWhite && !isCenter && (
                <div style={{ position: 'absolute', left: 0, top: 28, bottom: 28, width: 3, background: navyBlue, borderRadius: 2 }}></div>
              )}

              {/* Accent bar */}
              <div style={{
                width: isPinvest ? 36 : 40,
                height: isPinvest ? 3 : 5,
                background: accent,
                borderRadius: 2,
                marginBottom: 16,
                marginLeft: isCenter ? 'auto' : undefined,
                marginRight: isCenter ? 'auto' : undefined,
              }}></div>

              {/* Title */}
              <textarea
                value={slide?.title || ''}
                onChange={e => updateSlide(currentSlideIndex, { title: e.target.value })}
                style={{
                  fontFamily: `'${font}', ${isPinvest ? 'serif' : 'sans-serif'}`,
                  fontSize: isCenter ? 'clamp(26px,3.2vw,46px)' : 'clamp(20px,2.6vw,36px)',
                  fontWeight: isPinvest ? 600 : 800,
                  lineHeight: 1.1, letterSpacing: isPinvest ? '-0.3px' : '-0.8px',
                  color: titleColor,
                  border: 'none', outline: 'none', background: 'transparent',
                  width: '100%', resize: 'none', overflow: 'hidden',
                  marginBottom: 16,
                }}
                rows={2}
                placeholder="Slide title"
              />

              {/* Thin rule under title — Pinvest only, non-centered */}
              {isPinvest && !isCenter && (
                <div style={{ width: 80, height: 1, background: isPinvestWhite ? 'rgba(26,58,107,0.2)' : 'rgba(245,200,0,0.25)', marginBottom: 16, marginTop: -8 }}></div>
              )}

              {/* Content */}
              <textarea
                value={slide?.content || ''}
                onChange={e => updateSlide(currentSlideIndex, { content: e.target.value })}
                style={{
                  fontFamily: `'${font}', ${isPinvest ? 'serif' : 'sans-serif'}`,
                  fontSize: 'clamp(12px,1.4vw,17px)',
                  fontWeight: 300, lineHeight: 1.8,
                  color: contentColor,
                  border: 'none', outline: 'none', background: 'transparent',
                  width: '100%', resize: 'none', flex: 1,
                }}
                placeholder="Slide content…"
              />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', borderTop: '1px solid var(--border)', background: 'white', flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: 'var(--ink3)' }}>Slide {currentSlideIndex + 1} of {presentation.slides.length}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...toolBtn, background: 'var(--surface2)' }} onClick={() => setActiveTab('export')}>↓ Export</button>
            <button style={{ background: isPinvest ? accent : 'var(--brand)', color: isPinvestWhite ? navyBlue : 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13.5, cursor: 'pointer', fontWeight: 600 }}
              onClick={() => { handleSave(); alert('Link copied! (Share coming soon)') }}>Share</button>
          </div>
        </div>
      </div>

      {/* ── PROPERTIES PANEL ── */}
      <div style={{ borderLeft: '1px solid var(--border)', overflowY: 'auto', background: 'white', display: 'flex', flexDirection: 'column' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {(['edit','design','layout','export'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '12px 0', fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
              border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === tab ? accent : 'transparent'}`,
              color: activeTab === tab ? (isPinvest ? '#b8860b' : 'var(--brand-dim)') : 'var(--ink3)',
              fontFamily: 'var(--font-body)',
            }}>{tab}</button>
          ))}
        </div>

        <div style={{ padding: 16, flex: 1 }}>
          {/* EDIT TAB */}
          {activeTab === 'edit' && (
            <>
              <div style={propLabel}>Slide title</div>
              <textarea
                value={slide?.title || ''}
                onChange={e => updateSlide(currentSlideIndex, { title: e.target.value })}
                rows={3}
                placeholder="Write the headline for this slide"
                style={{ ...fieldStyle, resize: 'vertical', marginBottom: 16, fontSize: 14, fontWeight: 650 }}
              />

              <div style={propLabel}>On-slide copy</div>
              <textarea
                value={slide?.content || ''}
                onChange={e => updateSlide(currentSlideIndex, { content: e.target.value })}
                rows={10}
                placeholder="Add one bullet or sentence per line"
                style={{ ...fieldStyle, resize: 'vertical', marginBottom: 16 }}
              />

              <div style={propLabel}>Speaker notes</div>
              <textarea
                value={slide?.notes || ''}
                onChange={e => updateSlide(currentSlideIndex, { notes: e.target.value })}
                rows={7}
                placeholder="Add presenter notes, objections, or talk track"
                style={{ ...fieldStyle, resize: 'vertical', marginBottom: 16 }}
              />

              <div style={propLabel}>Image prompt</div>
              <textarea
                value={slide?.imagePrompt || ''}
                onChange={e => updateSlide(currentSlideIndex, { imagePrompt: e.target.value })}
                rows={5}
                placeholder="Describe the visual background for this slide"
                style={{ ...fieldStyle, resize: 'vertical' }}
              />
            </>
          )}

          {/* DESIGN TAB */}
          {activeTab === 'design' && (
            <>
              <div style={propLabel}>Accent color</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
                {ACCENT_COLORS.map(c => (
                  <div key={c} onClick={() => setAccent(c)} style={{
                    aspectRatio: '1', borderRadius: 8, background: c, cursor: 'pointer',
                    border: `2px solid ${accent === c ? 'var(--ink)' : 'transparent'}`,
                    transition: 'transform .1s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'}
                  />
                ))}
              </div>

              <div style={propLabel}>Theme</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                {THEME_OPTIONS.map(t => {
                  const isActive = presentation.theme === t.id
                  const isPinvestOpt = t.id.startsWith('pinvest')
                  return (
                    <div key={t.id} onClick={() => setTheme(t.id as any)} style={{
                      border: `1.5px solid ${isActive ? (isPinvestOpt ? '#f5c800' : 'var(--brand)') : 'var(--border2)'}`,
                      borderRadius: 8, padding: 8, cursor: 'pointer', transition: 'all .15s',
                      background: t.id === 'pinvest' ? '#0d1120' : 'white',
                    }}>
                      <div style={{ height: 32, borderRadius: 4, background: t.bg, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', overflow: 'hidden' }}>
                        <div style={{ width: 14, height: 3, borderRadius: 2, background: t.accent, flexShrink: 0 }}></div>
                        {isPinvestOpt && (
                          <span style={{ fontSize: 8, fontFamily: 'monospace', color: t.id === 'pinvest' ? '#f5c800' : '#1a3a6b', letterSpacing: '0.05em', fontWeight: 700 }}>PINVEST</span>
                        )}
                      </div>
                      <div style={{ fontSize: 10.5, color: t.id === 'pinvest' ? '#f5c800' : 'var(--ink3)', fontFamily: isPinvestOpt ? 'Cormorant Garamond, serif' : 'inherit', lineHeight: 1.3 }}>{t.label}</div>
                    </div>
                  )
                })}
              </div>

              <div style={propLabel}>Font</div>
              <select value={font} onChange={e => setFont(e.target.value)} style={{ width: '100%', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--ink)', background: 'var(--surface)', outline: 'none', marginBottom: 16 }}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>

              <div style={propLabel}>Speaker notes</div>
              <textarea
                value={slide?.notes || ''}
                onChange={e => updateSlide(currentSlideIndex, { notes: e.target.value })}
                rows={4}
                placeholder="Notes for this slide…"
                style={{ width: '100%', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px', fontSize: 12, resize: 'none', outline: 'none', color: 'var(--ink2)', lineHeight: 1.5 }}
              />
            </>
          )}

          {/* LAYOUT TAB */}
          {activeTab === 'layout' && (
            <>
              <div style={propLabel}>Slide layout</div>
              {LAYOUTS.map(l => (
                <button key={l.id} onClick={() => updateSlide(currentSlideIndex, { layout: l.id })} style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: 6,
                  border: `1px solid ${slide?.layout === l.id ? accent : 'var(--border2)'}`,
                  borderRadius: 8, background: slide?.layout === l.id ? (isPinvest ? 'rgba(245,200,0,0.06)' : 'var(--brand-glow)') : 'var(--surface2)',
                  color: slide?.layout === l.id ? (isPinvest ? '#b8860b' : 'var(--brand-dim)') : 'var(--ink2)',
                  fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>{l.label}</button>
              ))}
            </>
          )}

          {/* EXPORT TAB */}
          {activeTab === 'export' && (
            <>
              <div style={propLabel}>Export as</div>
              {[
                { format: 'pptx' as ExportFormat, icon: '📊', label: 'PowerPoint', sub: '.pptx — best for presenting', primary: true },
                { format: 'html' as ExportFormat, icon: '🌐', label: 'HTML Presentation', sub: '.html — embed anywhere' },
                { format: 'pdf' as ExportFormat, icon: '📄', label: 'PDF', sub: '.pdf — shareable & printable' },
                { format: 'docx' as ExportFormat, icon: '📝', label: 'Word / Text', sub: '.txt — editable content' },
                { format: 'json' as ExportFormat, icon: '{}', label: 'JSON', sub: '.json — raw data' },
              ].map(e => (
                <button key={e.format} onClick={() => handleExport(e.format)} style={{
                  width: '100%', textAlign: 'left', padding: '12px 12px', marginBottom: 8,
                  border: `1px solid ${e.primary ? accent : 'var(--border2)'}`,
                  borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  background: e.primary ? (isPinvest ? accent : 'var(--brand)') : 'var(--surface2)',
                  color: e.primary ? (isPinvestWhite ? navyBlue : 'white') : 'var(--ink)',
                  display: 'flex', alignItems: 'flex-start', gap: 10, transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{e.icon}</span>
                  <span>
                    <strong style={{ fontSize: 13.5, display: 'block' }}>{e.label}</strong>
                    <span style={{ fontSize: 11, opacity: .7 }}>{e.sub}</span>
                  </span>
                </button>
              ))}
              {isPinvest && (
                <div style={{ marginTop: 12, padding: '12px', background: 'rgba(245,200,0,0.06)', border: '1px solid rgba(245,200,0,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#b8860b', marginBottom: 4, fontFamily: 'monospace', letterSpacing: '0.1em' }}>PINVEST PPTX INCLUDES</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', lineHeight: 1.6 }}>Yellow accent rule, logo, footer watermark, confidential label, and all speaker notes.</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
