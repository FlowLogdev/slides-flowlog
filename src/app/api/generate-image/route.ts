// src/app/api/generate-image/route.ts
// Generates a single slide image via OpenAI DALL-E 3
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    const { prompt, style } = await req.json()

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Enhance the prompt for slide backgrounds
    const enhancedPrompt = `${prompt}. 
Professional presentation slide visual. 
No text, no words, no letters, no logos.
Cinematic lighting, high resolution, 16:9 aspect ratio.
Style: ${style || 'modern corporate photography, clean and professional'}.`

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: '1792x1024',   // closest to 16:9 widescreen
      quality: 'standard',
      response_format: 'url',
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) throw new Error('No image URL returned')

    return NextResponse.json({ url: imageUrl })

  } catch (err: any) {
    console.error('[generate-image] error:', err)

    // Return a specific error for content policy violations
    if (err?.code === 'content_policy_violation') {
      return NextResponse.json({ error: 'Image prompt was rejected by content policy', safe: false }, { status: 422 })
    }

    return NextResponse.json(
      { error: 'Image generation failed', detail: err?.message || String(err) },
      { status: 500 }
    )
  }
}
