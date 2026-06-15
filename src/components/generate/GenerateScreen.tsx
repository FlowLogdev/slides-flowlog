'use client'
// src/components/generate/GenerateScreen.tsx
import { useState } from 'react'
import { Screen } from '@/components/AppShell'
import { useStore } from '@/lib/store'
import { BUILTIN_TEMPLATES } from '@/lib/templates'
import { Presentation, Slide } from '@/lib/types'
import { buildLocalDeck } from '@/lib/generation'

interface Props { onNavigate: (s: Screen) => void }

const SAMPLES = [
  'Q3 sales review for the leadership team — revenue, pipeline, wins and next quarter forecast',
  'Investor pitch for a fintech startup raising Series A — market opportunity and traction',
  'Team onboarding presentation for a new hire\'s first day at a SaaS company',
  'Pinvest Capital — Q4 portfolio performance review for LP update',
]

function fallback(prompt: string, count: number, template?: string): Slide[] {
  const isPinvest = template === 'pinvest'
  const slides: Slide[] = [
    { id: '0', title: prompt || 'Presentation', content: 'Key theme one\nKey theme two\nKey theme three', notes: 'Welcome the audience.', layout: isPinvest ? 'pinvest-title' : 'centered', emoji: isPinvest ? '›' : '✦' },
    { id: '1', title: 'The Challenge', content: '• Market conditions are shifting\n• Teams need better tools\n• Current solutions leave gaps', notes: 'Paint the pain points.', layout: isPinvest ? 'pinvest-content' : 'default', emoji: isPinvest ? '◆' : '🎯' },
    { id: '2', title: 'Our Approach', content: '• Data-driven methodology\n• Proven framework\n• Measurable outcomes', notes: 'Explain your angle.', layout: isPinvest ? 'pinvest-content' : 'default', emoji: isPinvest ? '◆' : '⚡' },
    { id: '3', title: 'Key Results', content: '3× improvement in output\n40% reduction in time-to-market\n$2M in identified savings', notes: 'Lead with numbers.', layout: isPinvest ? 'pinvest-content' : 'default', emoji: isPinvest ? '◆' : '📊' },
    { id: '4', title: 'Next Steps', content: 'Schedule a strategy session\nReview proposal by Friday\nAlign stakeholders on Q1 plan', notes: 'Close with a CTA.', layout: isPinvest ? 'pinvest-closing' : 'centered', emoji: isPinvest ? '◆' : '🚀' },
  ]

  return slides.slice(0, count)
}

export default function GenerateScreen({ onNavigate }: Props) {
  const [prompt, setPrompt] = useState('')
  const [slideCount, setSlideCount] = useState(8)
  const [tone, setTone] = useState('professional')
  const [language, setLanguage] = useState('english')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const { setPresentation, setIsGenerating, setLoadingStep } = useStore()

  async function generate() {
    if (!prompt.trim()) return
    setIsGenerating(true)
    onNavigate('generating')

    const tmpl = BUILTIN_TEMPLATES.find(t => t.id === selectedTemplate)

    // Animate steps
    let step = 0
    const stepInterval = setInterval(() => {
      step++
      setLoadingStep(step)
      if (step >= 4) clearInterval(stepInterval)
    }, 900)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'generate', prompt, slideCount, tone, language, template: selectedTemplate }),
      })
      const data = await res.json()
      const slides: Slide[] = (data.slides || []).map((s: Omit<Slide, 'id'>, i: number) => ({ ...s, id: String(i) }))
      const local = buildLocalDeck({ mode: 'generate', prompt, slideCount, tone, language, template: selectedTemplate })
      const pres: Presentation = {
        id: Math.random().toString(36).slice(2),
        title: data.title || local.title || prompt,
        slides: slides.length > 0 ? slides : local.slides,
        theme: data.theme || tmpl?.theme || 'light',
        accent: data.accent || tmpl?.accent || '#0ACF83',
        font: data.font || tmpl?.font || 'Syne',
        template: data.template || selectedTemplate || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setPresentation(pres)
    } catch {
      setPresentation(buildLocalDeck({ mode: 'generate', prompt, slideCount, tone, language, template: selectedTemplate }))
    } finally {
      clearInterval(stepInterval)
      setLoadingStep(4)
      setIsGenerating(false)
      setTimeout(() => onNavigate('editor'), 400)
    }
  }

  const isPinvestSelected = selectedTemplate === 'pinvest' || selectedTemplate === 'pinvest-white'

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 32px' }}>
      <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>What will you present?</h2>
      <p style={{ color: 'var(--ink3)', fontSize: 15, marginBottom: 36, fontWeight: 300 }}>Describe your topic — AI builds a polished professional deck</p>

      {/* TEMPLATE PICKER */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Template</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedTemplate(null)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${selectedTemplate === null ? 'var(--brand)' : 'var(--border2)'}`,
              background: selectedTemplate === null ? 'var(--brand-glow)' : 'none',
              color: selectedTemplate === null ? 'var(--brand-dim)' : 'var(--ink2)',
              fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
            }}
          >None</button>
          {BUILTIN_TEMPLATES.map(tmpl => (
            <button key={tmpl.id} onClick={() => setSelectedTemplate(tmpl.id)} style={{
              padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${selectedTemplate === tmpl.id ? tmpl.accent : 'var(--border2)'}`,
              background: selectedTemplate === tmpl.id ? (tmpl.id === 'pinvest' ? 'rgba(184,151,42,0.08)' : 'var(--brand-glow)') : 'none',
              color: selectedTemplate === tmpl.id ? (tmpl.id === 'pinvest' ? '#b8972a' : 'var(--brand-dim)') : 'var(--ink2)',
              fontFamily: tmpl.id === 'pinvest' ? 'Cormorant Garamond, serif' : 'var(--font-body)',
              fontSize: 13.5, fontWeight: tmpl.id === 'pinvest' ? 600 : 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {tmpl.id === 'pinvest' && <span style={{ color: '#b8972a', fontSize: 11 }}>◆</span>}
              {tmpl.name}
              {tmpl.isCustom && <span style={{ fontSize: 10, background: tmpl.accent, color: tmpl.id === 'pinvest' ? '#0d0e11' : 'white', padding: '1px 5px', borderRadius: 100 }}>Custom</span>}
            </button>
          ))}
        </div>
        {isPinvestSelected && (
          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: 'rgba(184,151,42,0.06)', border: '1px solid rgba(184,151,42,0.2)',
            borderRadius: 8, fontSize: 13, color: '#b8972a',
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 400
          }}>
            ◆ Pinvest Capital template selected — dark ink background, gold accents, Cormorant Garamond typography, institutional tone
          </div>
        )}
      </div>

      {/* PROMPT */}
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        rows={4}
        placeholder={isPinvestSelected
          ? 'e.g. Q4 portfolio performance review for LP update — include IRR, DPI, top holdings and market outlook'
          : 'e.g. Q3 sales review for the leadership team — revenue, pipeline, wins and next quarter forecast'
        }
        style={{
          width: '100%', border: `1.5px solid ${isPinvestSelected ? 'rgba(184,151,42,0.3)' : 'var(--border2)'}`,
          borderRadius: 14, padding: '18px 20px', fontSize: 15,
          resize: 'none', background: isPinvestSelected ? '#0d0e11' : 'var(--surface2)',
          outline: 'none', lineHeight: 1.6, transition: 'border .15s',
          fontFamily: isPinvestSelected ? 'Cormorant Garamond, serif' : 'var(--font-body)',
          color: isPinvestSelected ? '#f5f2ec' : 'var(--ink)',
        }}
        onFocus={e => e.currentTarget.style.borderColor = isPinvestSelected ? '#b8972a' : 'var(--brand)'}
        onBlur={e => e.currentTarget.style.borderColor = isPinvestSelected ? 'rgba(184,151,42,0.3)' : 'var(--border2)'}
      />

      {/* OPTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, margin: '16px 0' }}>
        {[
          { label: 'Slides', id: 'count', value: slideCount, onChange: (v: string) => setSlideCount(Number(v)), options: [5,8,10,12,15].map(n => ({ value: n, label: `${n} slides` })) },
          { label: 'Tone', id: 'tone', value: tone, onChange: (v: string) => setTone(v), options: [
            { value: 'professional', label: 'Professional' },
            { value: 'creative', label: 'Creative' },
            { value: 'minimal', label: 'Minimal' },
            { value: 'bold', label: 'Bold & punchy' },
            { value: 'academic', label: 'Academic' },
            { value: 'institutional', label: 'Institutional' },
          ]},
          { label: 'Language', id: 'lang', value: language, onChange: (v: string) => setLanguage(v), options: [
            { value: 'english', label: 'English' },
            { value: 'spanish', label: 'Spanish' },
            { value: 'portuguese', label: 'Portuguese' },
            { value: 'french', label: 'French' },
          ]},
        ].map(opt => (
          <div key={opt.id}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{opt.label}</div>
            <select
              value={opt.value}
              onChange={e => opt.onChange(e.target.value)}
              style={{ width: '100%', border: '1px solid var(--border2)', borderRadius: 8, padding: '9px 12px', fontSize: 13.5, color: 'var(--ink)', background: 'var(--surface)', outline: 'none' }}
            >
              {opt.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
      </div>

      <button
        onClick={generate}
        disabled={!prompt.trim()}
        style={{
          width: '100%', padding: '14px 32px', borderRadius: 10, border: 'none',
          background: isPinvestSelected ? 'var(--pinvest-gold)' : 'var(--brand)',
          color: isPinvestSelected ? '#0d0e11' : 'white',
          fontFamily: isPinvestSelected ? 'Cormorant Garamond, serif' : 'var(--font-head)',
          fontWeight: 700, fontSize: 16, cursor: 'pointer',
          transition: 'all .2s', letterSpacing: isPinvestSelected ? '0.05em' : '0.2px',
          opacity: !prompt.trim() ? 0.5 : 1,
        }}
      >
        {isPinvestSelected ? '◆ Generate Pinvest Presentation' : '✦ Generate presentation'}
      </button>

      {/* SAMPLES */}
      <div style={{ marginTop: 24, padding: 16, background: 'var(--surface2)', borderRadius: 12, borderLeft: `3px solid ${isPinvestSelected ? '#b8972a' : 'var(--brand)'}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: isPinvestSelected ? '#b8972a' : 'var(--brand-dim)', marginBottom: 8, letterSpacing: '0.08em' }}>SAMPLE PROMPTS</div>
        {SAMPLES.map((s, i) => (
          <div key={i} onClick={() => setPrompt(s.replace('→ ', ''))}
            style={{ fontSize: 13, color: 'var(--ink2)', cursor: 'pointer', padding: '6px 8px', borderRadius: 6, lineHeight: 1.5 }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface3)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'none'}
          >
            → {s}
          </div>
        ))}
      </div>
    </div>
  )
}
