'use client'
// src/components/create/CreateScreen.tsx
// The Gamma-style creation hub — all 4 modes with full prompts
import { useState, useRef } from 'react'
import { Screen } from '@/components/AppShell'
import { CreationMode, Presentation, Slide } from '@/lib/types'
import { useStore } from '@/lib/store'
import { BUILTIN_TEMPLATES } from '@/lib/templates'
import { buildLocalDeck } from '@/lib/generation'

interface Props {
  mode: CreationMode
  onModeChange: (m: CreationMode) => void
  onNavigate: (s: Screen) => void
}

// ── Slide count options 5–20 ──
const SLIDE_COUNTS = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]

const TONES = [
  { value: 'professional', label: 'Professional', desc: 'Polished & business-ready' },
  { value: 'creative',     label: 'Creative',     desc: 'Fresh & visually expressive' },
  { value: 'minimal',      label: 'Minimal',      desc: 'Clean & distraction-free' },
  { value: 'bold',         label: 'Bold',         desc: 'High-impact, punchy copy' },
  { value: 'academic',     label: 'Academic',     desc: 'Research & evidence-based' },
  { value: 'institutional',label: 'Institutional',desc: 'Formal, finance-grade' },
]

const LANGUAGES = [
  { value: 'english',    label: 'English'    },
  { value: 'spanish',    label: 'Spanish'    },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'french',     label: 'French'     },
  { value: 'german',     label: 'German'     },
  { value: 'italian',    label: 'Italian'    },
]

const MODE_CONFIG: Record<CreationMode, { icon: string; label: string; color: string; darkBg: boolean }> = {
  generate: { icon: '✦', label: 'Generate',      color: '#0ACF83', darkBg: true  },
  paste:    { icon: '📋', label: 'Paste text',    color: '#6366f1', darkBg: true  },
  template: { icon: '›',  label: 'Template',      color: '#f5c800', darkBg: true  },
  import:   { icon: '↑',  label: 'Import',        color: '#3b82f6', darkBg: true  },
}

const SAMPLE_PROMPTS: Record<CreationMode, string[]> = {
  generate: [
    'Q3 sales review for leadership — revenue, pipeline, wins and Q4 forecast',
    'Investor pitch for a fintech startup raising Series A — market, traction, ask',
    'Product launch deck for an AI-powered SaaS tool targeting enterprise buyers',
    'Team onboarding presentation for new hires at a fast-growing tech company',
    'Marketing strategy for a DTC brand entering the Latin American market',
  ],
  paste: [
    'Drop in meeting notes, a document, or rough bullet points',
    'Paste a blog post or article to turn into a presentation',
    'Copy in a research paper or report summary',
  ],
  template: [
    'Q4 portfolio performance review for LP update — IRR, DPI, market outlook',
    'New investment thesis presentation for the Investment Committee',
    'Annual fund summary for investors — performance, portfolio, next steps',
  ],
  import: [
    'Paste a URL to import a webpage as slides',
    'Drop in text from a Word doc or PDF',
    'Copy in an existing presentation outline to upgrade',
  ],
}

// fallback slides if API fails
function makeFallback(prompt: string, count: number, template?: string): Slide[] {
  const isPinvest = template?.startsWith('pinvest')
  const e = isPinvest ? '›' : '✦'
  return Array.from({ length: count }, (_, i) => ({
    id: String(i),
    title: i === 0 ? (prompt || 'My Presentation') : i === count - 1 ? 'Next Steps' : `Key Point ${i}`,
    content: i === 0 ? 'An overview of our key themes\nBuilt with slides.flowlog.dev' : `• Key insight ${i}A\n• Key insight ${i}B\n• Key insight ${i}C`,
    notes: 'Add your speaker notes here.',
    layout: i === 0 ? (isPinvest ? 'pinvest-title' : 'centered') : i === count - 1 ? (isPinvest ? 'pinvest-closing' : 'centered') : (isPinvest ? 'pinvest-content' : 'default'),
    emoji: e,
    imagePrompt: 'Professional business presentation background, abstract geometric, high quality',
  }))
}

export default function CreateScreen({ mode, onModeChange, onNavigate }: Props) {
  const [prompt, setPrompt]           = useState('')
  const [pastedText, setPastedText]   = useState('')
  const [slideCount, setSlideCount]   = useState(8)
  const [tone, setTone]               = useState('professional')
  const [language, setLanguage]       = useState('english')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [generateImages, setGenerateImages]     = useState(true)
  const [error, setError]             = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { setPresentation, setIsGenerating, setLoadingStep } = useStore()
  const cfg = MODE_CONFIG[mode]
  const isPinvest = selectedTemplate?.startsWith('pinvest')
  const tmpl = BUILTIN_TEMPLATES.find(t => t.id === selectedTemplate)

  async function handleGenerate() {
    const mainPrompt = prompt.trim()
    const text = pastedText.trim()

    if (mode === 'generate' && !mainPrompt) { setError('Please enter a topic or description'); return }
    if ((mode === 'paste' || mode === 'import') && !text && !mainPrompt) { setError('Please paste some content or enter a topic'); return }

    setError('')
    setIsGenerating(true)
    setLoadingStep(1)
    onNavigate('generating')

    // Step animation — labels will be shown in GeneratingScreen
    const steps = ['Analyzing content', 'Structuring slides', 'Writing copy', generateImages ? 'Generating images' : 'Applying design', 'Finalizing deck']
    let step = 1
    const stepInterval = setInterval(() => {
      step = Math.min(steps.length, step + 1)
      setLoadingStep(step)
    }, generateImages ? 1800 : 900)

    try {
      // 1. Generate slide content via Anthropic
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, prompt: mainPrompt || text, pastedText: text, slideCount, tone, language, template: selectedTemplate, generateImages }),
      })
      const genData = await genRes.json()
      if (!genRes.ok) throw new Error(genData.error || 'Generation failed')

      let slides: Slide[] = (genData.slides || []).map((s: any, i: number) => ({
        ...s,
        id: String(i),
        imageUrl: s.imageUrl,
      }))

      if (!slides.length) {
        slides = buildLocalDeck({ mode, prompt: mainPrompt, pastedText: text, slideCount, tone, language, template: selectedTemplate, generateImages }).slides
      }

      // 2. Generate images via OpenAI DALL-E 3 (in parallel, best-effort)
      if (generateImages) {
        setLoadingStep(4)
        const imageStyle = isPinvest
          ? 'luxury financial photography, dark blue navy tones, gold accents, editorial corporate'
          : tone === 'creative' ? 'vibrant modern illustration, bold colors'
          : 'clean professional photography, soft lighting, corporate'

        const imagePromises = slides.map(async (slide) => {
          if (!slide.imagePrompt) return slide
          try {
            const imgRes = await fetch('/api/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: slide.imagePrompt, style: imageStyle }),
            })
            if (!imgRes.ok) return slide
            const imgData = await imgRes.json()
            return { ...slide, imageUrl: imgData.url }
          } catch {
            return slide // silently skip failed images
          }
        })

        // Run images in batches of 3 to respect rate limits
        const batched: Slide[] = []
        for (let i = 0; i < imagePromises.length; i += 3) {
          const batch = await Promise.all(imagePromises.slice(i, i + 3))
          batched.push(...batch)
        }
        slides = batched
      }

      const pres: Presentation = {
        id: Math.random().toString(36).slice(2),
        title: genData.title || mainPrompt || 'My Presentation',
        slides,
        theme: genData.theme || tmpl?.theme || 'light',
        accent: genData.accent || tmpl?.accent || '#0ACF83',
        font: genData.font || tmpl?.font || 'Syne',
        template: genData.template || selectedTemplate || undefined,
        mode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      setPresentation(pres)
    } catch (err: any) {
      console.error(err)
      const pres = buildLocalDeck({ mode, prompt: mainPrompt, pastedText: text, slideCount, tone, language, template: selectedTemplate, generateImages })
      setPresentation(pres)
    } finally {
      clearInterval(stepInterval)
      setLoadingStep(5)
      setIsGenerating(false)
      setTimeout(() => onNavigate('editor'), 500)
    }
  }

  const canGenerate = mode === 'generate' ? prompt.trim().length > 0
    : mode === 'paste' || mode === 'import' ? (pastedText.trim().length > 0 || prompt.trim().length > 0)
    : prompt.trim().length > 0

  return (
    <div style={{ minHeight: 'calc(100vh - 57px)', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
      {/* ── MODE TABS ── */}
      <div style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 32px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {(Object.entries(MODE_CONFIG) as [CreationMode, typeof cfg][]).map(([m, c]) => (
          <button key={m} onClick={() => onModeChange(m)} style={{
            padding: '16px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
            color: mode === m ? 'var(--ink)' : 'var(--ink3)',
            borderBottom: `2px solid ${mode === m ? c.color : 'transparent'}`,
            display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
            transition: 'all .15s',
          }}>
            <span style={{ fontSize: 16 }}>{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px 24px 60px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 720 }}>

          {/* ── GENERATE MODE ── */}
          {mode === 'generate' && (
            <ModePanel
              icon="✦" color="#0ACF83"
              heading="What will you present?"
              subheading="Describe your topic and let AI build a polished, structured deck"
            >
              <PromptInput value={prompt} onChange={setPrompt} color="#0ACF83"
                placeholder="e.g. Q3 sales review for the leadership team — revenue, pipeline, wins and Q4 forecast"
                samples={SAMPLE_PROMPTS.generate}
              />
            </ModePanel>
          )}

          {/* ── PASTE MODE ── */}
          {mode === 'paste' && (
            <ModePanel
              icon="📋" color="#6366f1"
              heading="Paste your content"
              subheading="Drop in notes, an outline, a document — AI will structure it into slides"
            >
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder={`Paste your content here — meeting notes, blog post, research paper, bullet points, anything...\n\nAI will extract the key ideas and turn them into a structured, professional presentation.`}
                style={{
                  width: '100%', minHeight: 220, border: '1.5px solid rgba(0,0,0,0.12)',
                  borderRadius: 14, padding: '18px 20px', fontSize: 14.5,
                  color: 'var(--ink)', resize: 'vertical', background: 'white',
                  outline: 'none', lineHeight: 1.7, fontFamily: 'var(--font-body)',
                  transition: 'border .15s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'}
              />
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Optional: add instructions</div>
                <PromptInput value={prompt} onChange={setPrompt} color="#6366f1"
                  placeholder="e.g. Focus on the data insights, use a professional tone, emphasize the Q4 numbers"
                  samples={SAMPLE_PROMPTS.paste}
                  compact
                />
              </div>
            </ModePanel>
          )}

          {/* ── TEMPLATE MODE ── */}
          {mode === 'template' && (
            <ModePanel
              icon="›" color="#f5c800"
              heading="Start from a template"
              subheading="Choose a layout — AI fills it with your content"
            >
              {/* Template grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 24 }}>
                {BUILTIN_TEMPLATES.map(tmpl => {
                  const isBlack = tmpl.id === 'pinvest' || tmpl.id === 'pinvest-black'
                  const isWhite = tmpl.id === 'pinvest-white'
                  const isPinvestT = isBlack || isWhite
                  const isSelected = selectedTemplate === tmpl.id
                  return (
                    <div key={tmpl.id} onClick={() => setSelectedTemplate(isSelected ? null : tmpl.id)} style={{
                      border: `2px solid ${isSelected ? tmpl.accent : 'rgba(0,0,0,0.1)'}`,
                      borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                      transition: 'all .15s', background: isBlack ? '#0d1120' : 'white',
                      boxShadow: isSelected ? `0 0 0 3px ${tmpl.accent}22` : 'none',
                    }}>
                      {/* Mini preview */}
                      <div style={{
                        height: 80, background: isBlack ? '#0d1120' : isWhite ? '#fff' : tmpl.theme === 'dark' ? '#0d0f0e' : tmpl.theme === 'gradient' ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#fafafa',
                        padding: '10px 14px', position: 'relative', overflow: 'hidden',
                      }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: tmpl.accent }}></div>
                        {isPinvestT && (
                          <div style={{ position: 'absolute', top: 7, right: 10, fontSize: 8, fontWeight: 700, color: isBlack ? '#fff' : '#1a3a6b', fontFamily: 'Cormorant Garamond,serif', display: 'flex', alignItems: 'center', gap: 1 }}>
                            Pinvest<span style={{ color: '#f5c800', fontSize: 11 }}>›</span>
                          </div>
                        )}
                        <div style={{ width: 20, height: 2, background: tmpl.accent, borderRadius: 1, marginBottom: 6, marginTop: 4 }}></div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: isBlack ? '#fff' : isWhite ? '#1a3a6b' : ['dark','gradient'].includes(tmpl.theme) ? '#fff' : '#0d0f0e', fontFamily: isPinvestT ? 'Cormorant Garamond,serif' : 'Syne,sans-serif', marginBottom: 6 }}>
                          {tmpl.sampleSlides[0]?.title}
                        </div>
                        {[0,1].map(j => <div key={j} style={{ height: 1.5, borderRadius: 1, background: isBlack ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)', width: j === 0 ? '70%' : '50%', marginBottom: 4 }}></div>)}
                      </div>
                      <div style={{ padding: '10px 14px', background: isBlack ? '#111520' : 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: isBlack ? '#fff' : 'var(--ink)', fontFamily: isPinvestT ? 'Cormorant Garamond,serif' : 'var(--font-head)' }}>{tmpl.name}</span>
                          {tmpl.isCustom && <span style={{ fontSize: 9, background: tmpl.accent, color: isBlack ? '#0d1120' : isPinvestT ? '#1a3a6b' : 'white', padding: '1px 6px', borderRadius: 100, fontWeight: 700 }}>Custom</span>}
                          {isSelected && <span style={{ marginLeft: 'auto', fontSize: 14, color: tmpl.accent }}>✓</span>}
                        </div>
                        <div style={{ fontSize: 11, color: isBlack ? '#6b7280' : 'var(--ink4)', lineHeight: 1.4 }}>{tmpl.description}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <PromptInput value={prompt} onChange={setPrompt} color="#f5c800"
                placeholder={selectedTemplate?.startsWith('pinvest')
                  ? 'e.g. Q4 portfolio performance review for LP update — IRR, DPI, market outlook, pipeline'
                  : 'e.g. Product launch for enterprise SaaS tool — market opportunity, demo, pricing, next steps'}
                samples={SAMPLE_PROMPTS.template}
              />
            </ModePanel>
          )}

          {/* ── IMPORT MODE ── */}
          {mode === 'import' && (
            <ModePanel
              icon="↑" color="#3b82f6"
              heading="Import & enhance"
              subheading="Paste text from a doc, webpage, or PDF — AI restructures it into slides"
            >
              {/* Upload area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed rgba(59,130,246,0.3)', borderRadius: 14,
                  padding: '32px 24px', textAlign: 'center', cursor: 'pointer',
                  background: 'rgba(59,130,246,0.03)', marginBottom: 20, transition: 'all .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#3b82f6'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(59,130,246,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.3)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(59,130,246,0.03)' }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>📄</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6', marginBottom: 4 }}>Click to upload a file</div>
                <div style={{ fontSize: 12, color: 'var(--ink4)' }}>or paste content below · DOCX, TXT, MD supported</div>
                <input ref={fileInputRef} type="file" accept=".txt,.md,.docx" style={{ display: 'none' }}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const text = await file.text()
                    setPastedText(text.slice(0, 12000))
                  }}
                />
              </div>
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="Or paste your content here — text from a Word doc, PDF, webpage, or any source..."
                style={{
                  width: '100%', minHeight: 160, border: '1.5px solid rgba(0,0,0,0.12)',
                  borderRadius: 14, padding: '16px 18px', fontSize: 14, color: 'var(--ink)',
                  resize: 'vertical', background: 'white', outline: 'none', lineHeight: 1.7,
                  fontFamily: 'var(--font-body)', marginBottom: 16, transition: 'border .15s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'}
              />
              <PromptInput value={prompt} onChange={setPrompt} color="#3b82f6"
                placeholder="Optional: any specific instructions — e.g. focus on the financial data, add a summary slide, use formal tone"
                samples={SAMPLE_PROMPTS.import}
                compact
              />
            </ModePanel>
          )}

          {/* ── SHARED OPTIONS ── */}
          <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '24px', marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Slide count */}
              <div>
                <div style={labelStyle}>Number of slides</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min="5" max="20" value={slideCount}
                    onChange={e => setSlideCount(parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: cfg.color }}
                  />
                  <div style={{
                    minWidth: 44, height: 36, background: cfg.color + '18', border: `1.5px solid ${cfg.color}44`,
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700, color: cfg.color,
                  }}>{slideCount}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink4)', marginTop: 4 }}>
                  <span>5 min</span><span>20 max</span>
                </div>
              </div>

              {/* Language */}
              <div>
                <div style={labelStyle}>Language</div>
                <select value={language} onChange={e => setLanguage(e.target.value)} style={selectStyle}>
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>

            {/* Tone selector */}
            <div>
              <div style={labelStyle}>Tone</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {TONES.map(t => (
                  <div key={t.value} onClick={() => setTone(t.value)} style={{
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'all .15s',
                    border: `1.5px solid ${tone === t.value ? cfg.color : 'rgba(0,0,0,0.1)'}`,
                    background: tone === t.value ? cfg.color + '10' : 'white',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: tone === t.value ? cfg.color : 'var(--ink)', marginBottom: 2 }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink4)', lineHeight: 1.3 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Image toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, padding: '14px 16px', background: '#f8f9fa', borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)' }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                  🎨 Generate AI images with DALL-E 3
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink4)' }}>
                  OpenAI creates a unique visual for each slide · adds ~30s per slide
                </div>
              </div>
              <div
                onClick={() => setGenerateImages(!generateImages)}
                style={{
                  width: 46, height: 26, borderRadius: 13, cursor: 'pointer', transition: 'all .2s',
                  background: generateImages ? cfg.color : '#d1d5db', position: 'relative', flexShrink: 0,
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3, transition: 'left .2s',
                  left: generateImages ? 23 : 3,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}></div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 13.5 }}>
              {error}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            style={{
              width: '100%', padding: '16px 32px', borderRadius: 12, border: 'none',
              background: canGenerate ? cfg.color : '#d1d5db',
              color: isPinvest && selectedTemplate === 'pinvest-white' ? '#1a3a6b' : 'white',
              fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16.5, cursor: canGenerate ? 'pointer' : 'not-allowed',
              transition: 'all .2s', letterSpacing: '0.2px',
              boxShadow: canGenerate ? `0 4px 24px ${cfg.color}44` : 'none',
            }}
          >
            {cfg.icon} Generate {slideCount} slides
          </button>

          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--ink4)' }}>
            Powered by Claude (Anthropic){generateImages ? ' + DALL-E 3 (OpenAI)' : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ModePanel({ icon, color, heading, subheading, children }: { icon: string; color: string; heading: string; subheading: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '28px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color }}>
          {icon}
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.3px', margin: 0 }}>{heading}</h2>
          <p style={{ fontSize: 13.5, color: 'var(--ink3)', margin: 0, fontWeight: 300 }}>{subheading}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function PromptInput({ value, onChange, color, placeholder, samples, compact }: {
  value: string; onChange: (v: string) => void; color: string;
  placeholder: string; samples: string[]; compact?: boolean
}) {
  const [showSamples, setShowSamples] = useState(false)
  return (
    <div>
      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={compact ? 2 : 4}
          placeholder={placeholder}
          style={{
            width: '100%', border: `1.5px solid rgba(0,0,0,0.12)`, borderRadius: 12,
            padding: '14px 16px', fontSize: 14.5, color: 'var(--ink)', resize: 'none',
            background: 'white', outline: 'none', lineHeight: 1.6, fontFamily: 'var(--font-body)',
            transition: 'border .15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = color; setShowSamples(true) }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; setTimeout(() => setShowSamples(false), 200) }}
        />
      </div>
      {!compact && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Try these</div>
          {samples.map((s, i) => (
            <div key={i} onClick={() => onChange(s)} style={{
              fontSize: 13, color: 'var(--ink2)', cursor: 'pointer', padding: '7px 10px',
              borderRadius: 8, transition: 'background .1s', lineHeight: 1.5,
              borderLeft: `2px solid ${color}33`,  marginBottom: 4,
            }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f8f9fa'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'none'}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: 'var(--ink4)',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
}
const selectStyle: React.CSSProperties = {
  width: '100%', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8,
  padding: '10px 12px', fontSize: 14, color: 'var(--ink)', background: 'white', outline: 'none',
}
