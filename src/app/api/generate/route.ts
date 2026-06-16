// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildLocalDeck, hasUsableAnthropicKey } from '@/lib/generation'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  try {
    const { mode, prompt, pastedText, slideCount, tone, language, template, generateImages } = body

    const count = Math.min(20, Math.max(5, parseInt(slideCount) || 8))
    const isPinvest = template === 'pinvest' || template === 'pinvest-white'
    const isWhite = template === 'pinvest-white'

    if (!hasUsableAnthropicKey()) {
      const local = buildLocalDeck({ mode, prompt, pastedText, slideCount: count, tone, language, template, generateImages })
      return NextResponse.json({
        title: local.title,
        slides: local.slides,
        theme: local.theme,
        accent: local.accent,
        font: local.font,
        template: local.template,
        meta: {
          model: 'local-structured-parser',
          slideCount: local.slides.length,
          mode,
          template: template || null,
          imagesRequested: !!generateImages,
          fallbackReason: 'ANTHROPIC_API_KEY is not configured',
        },
      })
    }

    // Build the user content based on mode
    let userContent = ''
    if (mode === 'paste' && pastedText?.trim()) {
      userContent = `Convert this content into a ${count}-slide presentation:\n\n${pastedText.trim()}`
    } else if (mode === 'template') {
      userContent = `Create a ${count}-slide presentation using the ${template} template about: ${prompt}`
    } else if (mode === 'import') {
      userContent = `Extract and reorganize this into ${count} clean presentation slides:\n\n${pastedText || prompt}`
    } else {
      userContent = `Create a ${count}-slide presentation about: ${prompt}`
    }

    const layoutFirst = isPinvest ? 'pinvest-title' : 'centered'
    const layoutMid   = isPinvest ? 'pinvest-content' : 'default'
    const layoutLast  = isPinvest ? 'pinvest-closing' : 'centered'
    const emojiChar   = isPinvest ? '›' : '✦'

    const systemPrompt = `You are a world-class presentation designer and strategist${isPinvest ? ' specializing in institutional finance and investment communications' : ''}.

Generate exactly ${count} slides. Return ONLY valid JSON — no markdown fences, no preamble, no explanation.

Required JSON format:
{
  "title": "Full Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "content": "Bullet or line 1\\nBullet or line 2\\nBullet or line 3\\nBullet or line 4\\nBullet or line 5",
      "notes": "Speaker notes - 3-5 sentences of genuine talking points, objections, and delivery guidance",
      "layout": "default",
      "emoji": "${emojiChar}",
      "imagePrompt": "A photorealistic image of..."
    }
  ]
}

LAYOUT RULES (strictly follow):
- Slide 1: layout = "${layoutFirst}" — hero/title, no bullets, just a bold statement
- Slides 2 to ${count - 1}: layout = "${layoutMid}" — body content with 4-6 substantial bullets
- Slide ${count}: layout = "${layoutLast}" — call-to-action or summary, centered
- Use "split" for 1-2 comparison slides in the middle

CONTENT RULES:
- Tone: ${tone}
- Language: ${language}
- Each content line is plain text, no markdown, separated by \\n
- Do not write thin slides. Every body slide needs 4-6 substantial lines.
- Each content line should be 10-20 words, specific enough to present without extra research.
- Include buyer pain, business impact, process, proof, pricing, risk, implementation, and next step where relevant.
- Avoid generic phrases like "key insight", "our approach", "unlock potential", "seamless", and "next-gen".
- Speaker notes must be 3-5 complete sentences with presenter talk track, not a repeat of bullets.
- If the prompt is commercial or sales-oriented, write as a persuasive buyer-facing sales deck.

IMAGE PROMPT RULES (for imagePrompt field):
- Write a vivid, detailed DALL-E 3 prompt for a slide background or visual
- Style: ${isPinvest ? 'professional financial photography, dark blue tones, luxury corporate aesthetic' : 'modern clean illustration, professional, high quality'}
- Make it relevant to that specific slide's topic
- Do NOT include text, logos, or charts in the image
- Every slide MUST have an imagePrompt, even title and closing slides

${isPinvest ? `PINVEST STYLE GUIDE:
- Authoritative, data-driven, institutional language
- Use financial metrics (IRR, DPI, AUM, basis points) where natural
- Reference Latin American and Iberian markets where relevant  
- Formal register — no contractions, no casual language
- All emoji fields must be "›"` : ''}

Slide count: exactly ${count}. Not one more, not one less.`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 12000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    
    let parsed: any
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // Try to extract JSON object from the response
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) {
        parsed = JSON.parse(match[0])
      } else {
        throw new Error('Could not parse AI response as JSON')
      }
    }

    // Validate and clamp slide count
    if (!Array.isArray(parsed.slides)) {
      throw new Error('Invalid response structure')
    }

    // Ensure every slide has required fields
    parsed.slides = parsed.slides.slice(0, count).map((s: any, i: number) => ({
      title: s.title || `Slide ${i + 1}`,
      content: s.content || '',
      notes: s.notes || '',
      layout: s.layout || (i === 0 ? layoutFirst : i === parsed.slides.length - 1 ? layoutLast : layoutMid),
      emoji: s.emoji || emojiChar,
      imagePrompt: s.imagePrompt || `Professional ${tone} business presentation background, abstract, high quality`,
    }))

    const sourceText = `${pastedText || ''}\n${prompt || ''}`.trim()
    const looksGeneric = parsed.slides.some((s: any) =>
      /^(key point|the challenge|our approach|key results|next steps)$/i.test(String(s.title || '').trim())
    )
    const looksSparse = parsed.slides.some((s: any, i: number) => {
      if (i === 0 || i === parsed.slides.length - 1) return false
      const lines = String(s.content || '').split('\n').map(line => line.trim()).filter(Boolean)
      const wordCount = lines.join(' ').split(/\s+/).filter(Boolean).length
      return lines.length < 4 || wordCount < 38
    })

    if (((mode === 'paste' || mode === 'import') && sourceText.length > 120 && looksGeneric) || looksSparse) {
      const local = buildLocalDeck({ mode, prompt, pastedText, slideCount: count, tone, language, template, generateImages })
      return NextResponse.json({
        title: local.title,
        slides: local.slides,
        theme: local.theme,
        accent: local.accent,
        font: local.font,
        template: local.template,
        meta: {
          model: 'local-structured-parser',
          slideCount: local.slides.length,
          mode,
          template: template || null,
          imagesRequested: !!generateImages,
          fallbackReason: looksSparse ? 'AI response was too sparse for a complete deck' : 'AI response used generic placeholder slide titles',
        },
      })
    }

    return NextResponse.json({
      ...parsed,
      meta: {
        model: 'claude-sonnet-4-6',
        slideCount: parsed.slides.length,
        mode,
        template: template || null,
        imagesRequested: !!generateImages,
      }
    })

  } catch (err: any) {
    console.error('[generate] error:', err)
    const count = Math.min(20, Math.max(5, parseInt(body.slideCount) || 8))
    const local = buildLocalDeck({
      mode: body.mode,
      prompt: body.prompt,
      pastedText: body.pastedText,
      slideCount: count,
      tone: body.tone,
      language: body.language,
      template: body.template,
      generateImages: body.generateImages,
    })

    return NextResponse.json({
      title: local.title,
      slides: local.slides,
      theme: local.theme,
      accent: local.accent,
      font: local.font,
      template: local.template,
      meta: {
        model: 'local-structured-parser',
        slideCount: local.slides.length,
        mode: body.mode,
        template: body.template || null,
        imagesRequested: !!body.generateImages,
        fallbackReason: err?.message || String(err),
      },
    })
  }
}
