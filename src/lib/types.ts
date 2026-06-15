// src/lib/types.ts

export type SlideLayout = 'default' | 'centered' | 'split' | 'blank' | 'pinvest-title' | 'pinvest-content' | 'pinvest-closing'

export type SlideTheme = 'light' | 'dark' | 'gradient' | 'minimal' | 'pinvest' | 'pinvest-white'

export type CreationMode = 'generate' | 'paste' | 'template' | 'import'

export interface Slide {
  id: string
  title: string
  content: string
  notes: string
  layout: SlideLayout
  emoji?: string
  imageUrl?: string        // AI-generated image (OpenAI DALL-E)
  imagePrompt?: string     // prompt used to generate the image
}

export interface Presentation {
  id: string
  title: string
  slides: Slide[]
  theme: SlideTheme
  accent: string
  font: string
  createdAt: number
  updatedAt: number
  template?: string
  mode?: CreationMode
}

export interface SlideTemplate {
  id: string
  name: string
  description: string
  thumbnail: string
  theme: SlideTheme
  accent: string
  font: string
  isPremium?: boolean
  isCustom?: boolean
  sampleSlides: Omit<Slide, 'id'>[]
}

export type ExportFormat = 'pptx' | 'pdf' | 'docx' | 'html' | 'json'

export interface GenerateOptions {
  mode: CreationMode
  prompt: string
  pastedText?: string
  slideCount: number       // 5–20
  tone: string
  language: string
  template?: string
  generateImages: boolean
}

export interface GenerationProgress {
  step: number
  total: number
  label: string
  sublabel?: string
}
