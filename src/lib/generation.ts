import { CreationMode, Presentation, Slide } from './types'
import { getTheme } from './themes'
import { getTemplateById } from './templates'

type DeckInput = {
  mode: CreationMode
  prompt?: string
  pastedText?: string
  slideCount: number
  tone?: string
  language?: string
  template?: string | null
  title?: string
  generateImages?: boolean
}

const MOJIBAKE: Record<string, string> = {
  'â€”': '-',
  'â€“': '-',
  'â†’': '->',
  'â€¢': '-',
  'â‰ ': '!=',
  'â‰': '!=',
  'â€º': '>',
  'âœ¦': '*',
  'â—†': '◆',
  'ðŸ“‹': '',
  'ðŸŽ¨': '',
  '—': '-',
  '–': '-',
}

function cleanText(value: string): string {
  return Object.entries(value || '').reduce((text, [bad, good]) => text.replaceAll(bad, good), value || '')
}

function stripMarkdown(value: string): string {
  return cleanText(value)
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .trim()
}

function cleanDeckTitle(value: string): string {
  return stripMarkdown(value).replace(/\bC#-Slide\b/g, '20-Slide')
}

function isPinvestTemplate(template?: string | null): boolean {
  return !!template?.startsWith('pinvest')
}

function slideLayout(index: number, total: number, template?: string | null): Slide['layout'] {
  if (index === 0) return isPinvestTemplate(template) ? 'pinvest-title' : 'centered'
  if (index === total - 1) return isPinvestTemplate(template) ? 'pinvest-closing' : 'centered'
  return isPinvestTemplate(template) ? 'pinvest-content' : 'default'
}

function findSpeakerNote(section: string): string {
  const note = section.match(/\*\*Speaker note:\*\*\s*([\s\S]*?)(?=\n\s*---|\n\s*##\s+SLIDE|\s*$)/i)
  return stripMarkdown(note?.[1] || '')
}

function removeSpeakerNote(section: string): string {
  return section.replace(/\*\*Speaker note:\*\*\s*[\s\S]*?(?=\n\s*---|\n\s*##\s+SLIDE|\s*$)/gi, '')
}

function compactLines(value: string): string[] {
  return removeSpeakerNote(value)
    .split('\n')
    .map(line => stripMarkdown(line).replace(/^#+\s*/, '').trim())
    .filter(Boolean)
    .filter(line => !/^---+$/.test(line))
}

function imagePromptFor(title: string, content: string, index: number, template?: string | null): string {
  const subject = `${title}. ${content.split('\n').slice(0, 2).join(' ')}`
  const style = isPinvestTemplate(template)
    ? 'premium dark navy cybersecurity pitch deck visual, precise light beams, gold accent, enterprise security atmosphere'
    : 'premium SaaS pitch deck visual, polished product storytelling, clean dimensional composition'

  return `${style}. Topic: ${subject}. No text, no logos, no charts, 16:9, high contrast, presentation-ready.`
}

export function makeLocalVisual(index: number, template?: string | null): string {
  const pinvest = isPinvestTemplate(template)
  const palettes = pinvest
    ? [
        ['#07111f', '#0f2748', '#f5c800'],
        ['#080b15', '#1a3a6b', '#d4a800'],
        ['#0a0d14', '#16213f', '#f4d35e'],
      ]
    : [
        ['#06281b', '#0ACF83', '#9ef7cf'],
        ['#111827', '#6366f1', '#f5c800'],
        ['#0f172a', '#06b6d4', '#f43f5e'],
      ]
  const [bg, mid, accent] = palettes[index % palettes.length]
  const seed = 70 + (index * 37) % 220
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="0.58" stop-color="${mid}"/>
      <stop offset="1" stop-color="${bg}"/>
    </linearGradient>
    <radialGradient id="r" cx="70%" cy="30%" r="55%">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.7"/>
      <stop offset="0.45" stop-color="${accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="34"/></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#g)"/>
  <rect width="1600" height="900" fill="url(#r)"/>
  <g opacity="0.18" stroke="${accent}" stroke-width="2">
    <path d="M120 760 C ${420 + seed} 520, ${690 - seed} 250, 1480 120" fill="none"/>
    <path d="M80 650 C ${360 + seed} 420, ${780 - seed} 360, 1500 230" fill="none"/>
    <path d="M240 830 C ${570 + seed} 620, ${900 - seed} 520, 1540 360" fill="none"/>
  </g>
  <circle cx="${1120 - seed}" cy="${260 + seed / 2}" r="180" fill="${accent}" opacity="0.12" filter="url(#blur)"/>
  <circle cx="${320 + seed}" cy="${620 - seed / 3}" r="140" fill="#ffffff" opacity="0.08" filter="url(#blur)"/>
  <g opacity="0.11" stroke="#fff">
    ${Array.from({ length: 18 }, (_, i) => `<line x1="${i * 96}" y1="0" x2="${i * 96 + 220}" y2="900"/>`).join('')}
  </g>
</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function sectionToSlide(section: string, headerTitle: string, index: number, total: number, template?: string | null): Slide {
  const note = findSpeakerNote(section)
  const lines = compactLines(section)
  const upperHeader = headerTitle.toUpperCase()
  const firstStrong = section.match(/\*\*([^*]+)\*\*/)
  const title = upperHeader === 'COVER' || upperHeader.includes('CLOSING')
    ? stripMarkdown(firstStrong?.[1] || headerTitle)
    : stripMarkdown(headerTitle)

  const contentLines = lines
    .filter(line => !/^SLIDE\s+\d+/i.test(line))
    .filter(line => line.toLowerCase() !== title.toLowerCase())
    .slice(0, index === 0 || index === total - 1 ? 4 : 6)

  const content = contentLines.join('\n')

  return {
    id: String(index),
    title,
    content,
    notes: note,
    layout: slideLayout(index, total, template),
    emoji: isPinvestTemplate(template) ? '>' : '*',
    imagePrompt: imagePromptFor(title, content, index, template),
    imageUrl: makeLocalVisual(index, template),
  }
}

function cleanContentLine(value: string): string {
  return stripMarkdown(value)
    .replace(/^(\d+[\).]|[>\-*]+)\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sentenceCase(value: string): string {
  const text = cleanContentLine(value)
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function splitScriptSentences(source: string): string[] {
  const normalized = removeSpeakerNote(cleanText(source))
    .replace(/\r/g, '')
    .replace(/\n{2,}/g, '\n')

  const lines = normalized
    .split('\n')
    .map(line => cleanContentLine(line.replace(/^#+\s*/, '')))
    .filter(Boolean)
    .filter(line => !/^slide\s+\d+/i.test(line))
    .filter(line => !/^speaker notes?:?/i.test(line))

  const expanded = lines.flatMap(line => {
    if (line.length < 120) return [line]
    return line.split(/(?<=[.!?])\s+/).map(sentenceCase)
  })

  const seen = new Set<string>()
  return expanded
    .map(sentenceCase)
    .filter(line => line.length > 3)
    .filter(line => {
      const key = line.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function inferTopic(source: string): string {
  const explicit = source.match(/^#\s+(.+)$/m)?.[1]
  if (explicit) return cleanDeckTitle(explicit)

  const lines = compactLines(source)
  const productLine = lines.find(line => /^[A-Z][A-Za-z0-9 ._-]{2,32}$/.test(line) && !/\s{2,}/.test(line))
  if (productLine) return cleanDeckTitle(productLine)

  const codeScan = source.match(/\bCodeScan\b/i)?.[0]
  if (codeScan) return 'CodeScan'

  return cleanDeckTitle(lines[0] || 'Generated Presentation')
}

function narrativeTitles(topic: string, count: number, source: string): string[] {
  const isCodeScan = /\bCodeScan\b/i.test(source) || /\bcode scan\b/i.test(source)
  const base = isCodeScan
    ? [
        'CodeScan',
        'THE PROMISE EVERYONE MAKES',
        'THE REALITY BEHIND THE PROMISE',
        'WHY MANUAL REVIEW BREAKS',
        'INTRODUCING CODESCAN',
        'WHAT CODESCAN CHECKS',
        'SECURITY RISKS FOUND EARLY',
        'QUALITY ISSUES MADE VISIBLE',
        'FROM SCAN TO FIX',
        'BUILT FOR DEVELOPMENT TEAMS',
        'REPORTS LEADERS CAN READ',
        'WHERE CODESCAN FITS',
        'SETUP AND ONBOARDING',
        'THE DAY-ONE WORKFLOW',
        'WHY TEAMS TRUST THE OUTPUT',
        'PRICING',
        'IMPLEMENTATION PLAN',
        'WHAT CHANGES AFTER LAUNCH',
        'WHY NOW',
        'NEXT STEP',
      ]
    : [
        topic,
        'THE PROMISE',
        'THE PROBLEM',
        'WHAT IS BROKEN TODAY',
        `INTRODUCING ${topic.toUpperCase()}`,
        'HOW IT WORKS',
        'CORE CAPABILITIES',
        'USER WORKFLOW',
        'PROOF POINTS',
        'DIFFERENTIATION',
        'OPERATING MODEL',
        'INTEGRATIONS',
        'SETUP',
        'ROLL OUT PLAN',
        'SUCCESS METRICS',
        'PRICING',
        'IMPLEMENTATION',
        'EXPECTED OUTCOMES',
        'WHY NOW',
        'NEXT STEP',
      ]

  if (count <= base.length) return base.slice(0, count)
  return Array.from({ length: count }, (_, i) => base[i] || `${topic} DETAIL ${i + 1}`)
}

function pickLinesForSlide(sentences: string[], index: number, total: number): string[] {
  if (!sentences.length) return []
  const usable = sentences.filter(line => line.length <= 180)
  const pool = usable.length ? usable : sentences
  const start = Math.floor((index / Math.max(total, 1)) * pool.length)
  const window = pool.slice(start, start + 8).concat(pool.slice(0, 8))

  return window
    .filter(line => line.length >= 12)
    .slice(0, index === 0 || index === total - 1 ? 2 : 4)
}

function enrichContentLines(topic: string, title: string, lines: string[], index: number, total: number): string[] {
  if (index === 0 || index === total - 1) return lines.slice(0, 3)

  const additions = [
    `Buyer impact: ${topic} turns this issue into a visible business decision`,
    `Operational value: teams get a repeatable workflow instead of scattered follow-up`,
    `Proof point: the slide should connect the claim to risk, cost, speed, or confidence`,
    `Decision lens: make the next action clear for the stakeholder in the room`,
    `Implementation detail: show how ${topic} fits into work the team already performs`,
  ]

  const cleaned = lines.map(sentenceCase).filter(Boolean)
  const used = new Set(cleaned.map(line => line.toLowerCase()))
  for (const addition of additions) {
    if (cleaned.length >= 5) break
    const candidate = sentenceCase(addition.replace('the slide', title.toLowerCase()))
    if (!used.has(candidate.toLowerCase())) {
      cleaned.push(candidate)
      used.add(candidate.toLowerCase())
    }
  }

  return cleaned.slice(0, 5)
}

function parseNarrativeSlides(source: string, count: number, template?: string | null): Slide[] {
  const topic = inferTopic(source)
  const sentences = splitScriptSentences(source)
  const titles = narrativeTitles(topic, count, source)

  return titles.map((title, i) => {
    const picked = pickLinesForSlide(sentences, i, titles.length)
    const contentLines = picked.length
      ? picked
      : [`Use the ${topic} script section for this moment`, `Connect this point back to ${topic}`]
    const content = enrichContentLines(topic, title, contentLines, i, titles.length).join('\n')
    const noteLines = sentences.slice(
      Math.floor((i / Math.max(titles.length, 1)) * Math.max(sentences.length - 1, 0)),
      Math.floor((i / Math.max(titles.length, 1)) * Math.max(sentences.length - 1, 0)) + 3
    )

    return {
      id: String(i),
      title,
      content,
      notes: noteLines.length ? noteLines.join(' ') : `Use this slide to explain ${title.toLowerCase()} in the context of ${topic}.`,
      layout: slideLayout(i, titles.length, template),
      emoji: isPinvestTemplate(template) ? '>' : '*',
      imagePrompt: imagePromptFor(title, content, i, template),
      imageUrl: makeLocalVisual(i, template),
    }
  })
}

function inferPromptTopic(prompt: string): string {
  const cleaned = cleanContentLine(prompt)
    .replace(/\b(i want to|please|can you|create|make|generate|build)\b/gi, ' ')
    .replace(/\b(a|an|the|commercial|presentation|deck|slides?|about|for|why|people|should|buy|my|services?|and|benefits?)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const domain = prompt.match(/\b[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+\b/)?.[0]
  if (domain) {
    const name = domain.split('.')[0]
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : domain
  }

  const codeScan = prompt.match(/\bCodeScan\b/i)?.[0]
  if (codeScan) return 'CodeScan'

  const words = cleaned.split(' ').filter(Boolean).slice(0, 4).join(' ')
  return cleanDeckTitle(words || prompt || 'Generated Presentation')
}

function promptValueProps(topic: string, prompt: string): string[] {
  const isCodeScan = /\bcodescan\b/i.test(`${topic} ${prompt}`)
  if (isCodeScan) {
    return [
      'Find risky code before it reaches production',
      'Turn security review into a repeatable workflow',
      'Give developers clear fixes, not vague warnings',
      'Give leaders reports they can act on',
      'Reduce review bottlenecks without lowering standards',
      'Protect client systems, data, and delivery timelines',
    ]
  }

  return [
    `Show buyers exactly why ${topic} matters now`,
    'Make the pain visible in business terms',
    'Present the service as a practical path forward',
    'Translate features into measurable outcomes',
    'Build trust with proof, process, and next steps',
    'Close with a clear offer and call to action',
  ]
}

function parsePromptSlides(prompt: string, count: number, template?: string | null): Slide[] {
  const topic = inferPromptTopic(prompt)
  const props = promptValueProps(topic, prompt)
  const titles = narrativeTitles(topic, count, prompt)

  const sections = [
    [`${topic} helps teams move faster without accepting avoidable risk`, props[0]],
    ['Everyone promises speed, quality, and security', 'The hard part is proving it on every release'],
    ['Manual reviews miss issues when teams are under pressure', 'Late fixes cost more and slow delivery'],
    ['Review work is fragmented across tools, pull requests, and spreadsheets', 'Leaders see activity, but not always the real risk'],
    [`${topic} gives teams a clearer way to inspect, prioritize, and act`, props[1]],
    ['Scan the work, surface the risk, explain the fix', 'Keep developers inside the workflow they already use'],
    [props[2], 'Prioritize high-impact issues before low-value noise'],
    [props[3], 'Turn technical findings into business-ready summaries'],
    ['Move from discovery to remediation in the same motion', 'Assign owners, track status, and reduce repeat issues'],
    ['Built for engineering teams, agencies, and technical service providers', 'Use it before releases, audits, and client handoffs'],
    ['Readable reports show risk, severity, owner, and progress', 'Stakeholders get clarity without reading raw code'],
    [`Use ${topic} around active repositories, client projects, and release reviews`, 'Start where risk and revenue are already visible'],
    ['Connect one repository and run the first review', 'Use the first report to align the team around priorities'],
    ['Developers review findings, apply fixes, and rescan', 'Managers track what changed and what still needs attention'],
    [props[4], 'Standardize the review process across projects'],
    ['Start with a focused team package', 'Scale into managed reviews, compliance support, and enterprise coverage'],
    ['Pilot on one active project, then expand by team or client portfolio', 'Use the pilot report as the buying proof'],
    [props[5], 'Fewer late surprises, cleaner releases, stronger client confidence'],
    ['Security expectations are rising while delivery timelines keep shrinking', `${topic} gives buyers a practical answer now`],
    ['Book a pilot review', 'Run the first scan and review the findings together'],
  ]

  return titles.map((title, i) => {
    const contentLines = enrichContentLines(topic, title, sections[i] || sections[sections.length - 1], i, titles.length)
    const content = contentLines.join('\n')
    return {
      id: String(i),
      title,
      content,
      notes: `Use this slide to sell ${topic} from the buyer's point of view. Tie the message back to the original request: ${cleanContentLine(prompt)}`,
      layout: slideLayout(i, titles.length, template),
      emoji: isPinvestTemplate(template) ? '>' : '*',
      imagePrompt: imagePromptFor(title, content, i, template),
      imageUrl: makeLocalVisual(i, template),
    }
  })
}

function parseExplicitSlides(source: string, count: number, template?: string | null): Slide[] {
  const normalized = cleanText(source)
  const lines = normalized.split(/\r?\n/)
  const starts: { line: number; header: string }[] = []

  lines.forEach((line, index) => {
    const match = line.match(/^##\s*SLIDE\s+(.+)$/i)
    if (!match) return

    const header = stripMarkdown((match[1] || '')
      .replace(/^[^-:—–]*[-:—–]\s*/, '')
      .trim())

    starts.push({ line: index, header: header || `Slide ${starts.length + 1}` })
  })

  if (!starts.length) return []

  const sections = starts.map((start, i) => {
    const bodyStart = start.line + 1
    const bodyEnd = i + 1 < starts.length ? starts[i + 1].line : lines.length
    return {
      header: start.header,
      body: lines.slice(bodyStart, bodyEnd).join('\n'),
    }
  })

  const selected = sections.slice(0, count)
  return selected.map((section, i) => sectionToSlide(section.body, section.header, i, selected.length, template))
}

function parseLooseSlides(source: string, count: number, template?: string | null): Slide[] {
  const lines = compactLines(source)
  const chunks: string[][] = []
  let current: string[] = []

  for (const line of lines) {
    const looksLikeHeading = /^[A-Z0-9 &/:-]{6,}$/.test(line) && current.length > 0
    if (looksLikeHeading || current.length >= 5) {
      chunks.push(current)
      current = []
    }
    current.push(line)
  }
  if (current.length) chunks.push(current)

  return chunks.slice(0, count).map((chunk, i, arr) => {
    const title = stripMarkdown(chunk[0] || `Slide ${i + 1}`)
    const content = chunk.slice(1, 6).join('\n')
    return {
      id: String(i),
      title,
      content,
      notes: `Talk through ${title.toLowerCase()} and connect it to the overall story.`,
      layout: slideLayout(i, arr.length, template),
      emoji: isPinvestTemplate(template) ? '>' : '*',
      imagePrompt: imagePromptFor(title, content, i, template),
      imageUrl: makeLocalVisual(i, template),
    }
  })
}

function expandSlides(slides: Slide[], count: number, template?: string | null): Slide[] {
  if (slides.length >= count) return slides.slice(0, count)

  const expanded = [...slides]
  while (expanded.length < count) {
    const index = expanded.length
    const previous = expanded[index - 1]
    const title = index === count - 1 ? 'Next step' : `${previous?.title || 'Script'} continued`
    const content = previous?.content || 'Continue the story from the pasted script\nMake the next action clear'
    expanded.push({
      id: String(index),
      title,
      content,
      notes: previous?.notes || 'Use this slide to keep the story moving.',
      layout: slideLayout(index, count, template),
      emoji: isPinvestTemplate(template) ? '>' : '*',
      imagePrompt: imagePromptFor(title, content, index, template),
      imageUrl: makeLocalVisual(index, template),
    })
  }
  return expanded
}

export function buildLocalDeck(input: DeckInput): Presentation {
  const source = cleanText(input.pastedText?.trim() || input.prompt?.trim() || '')
  const count = Math.min(20, Math.max(5, input.slideCount || 8))
  const parsed = parseExplicitSlides(source, count, input.template) || []
  const shouldExpandPrompt = !input.pastedText?.trim() && input.mode === 'generate'
  const narrative = parsed.length
    ? parsed
    : shouldExpandPrompt
      ? parsePromptSlides(source, count, input.template)
      : parseNarrativeSlides(source, count, input.template)
  const slides = expandSlides(narrative, count, input.template)
  const template = input.template ? getTemplateById(input.template) : undefined
  const themeId = template?.theme || (input.template?.startsWith('pinvest') ? 'pinvest' : 'dark')
  const theme = getTheme(themeId as any)
  const title = cleanDeckTitle(input.title || source.match(/^#\s+(.+)$/m)?.[1] || slides[0]?.title || 'Generated Presentation')

  return {
    id: Math.random().toString(36).slice(2),
    title,
    slides,
    theme: themeId as any,
    accent: template?.accent || theme.accentOverride || (input.template?.startsWith('pinvest') ? '#f5c800' : '#0ACF83'),
    font: template?.font || theme.fontOverride || 'Syne',
    template: input.template || undefined,
    mode: input.mode,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function hasUsableAnthropicKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY || ''
  return key.startsWith('sk-ant-') && !key.includes('REPLACE_ME')
}
