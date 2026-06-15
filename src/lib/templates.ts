// src/lib/templates.ts
import { SlideTemplate } from './types'

// ── PINVEST LLC — WHITE TEMPLATE ──────────────────────────────────────────────
export const PINVEST_WHITE_TEMPLATE: SlideTemplate = {
  id: 'pinvest-white',
  name: 'Pinvest LLC — White',
  description: 'Clean white background — navy & yellow brand colors, Cormorant Garamond',
  thumbnail: '/templates/pinvest-white-thumb.png',
  theme: 'pinvest-white' as any,
  accent: '#f5c800',
  font: 'Cormorant Garamond',
  isPremium: false,
  isCustom: true,
  sampleSlides: [
    {
      title: 'Investment Strategy Overview',
      content: 'Portfolio allocation across asset classes\nRisk-adjusted return targets for FY2025\nMarket positioning and thesis',
      notes: 'Open with strong market context. Reference recent Fed decisions.',
      layout: 'pinvest-title',
      emoji: '›',
    },
    {
      title: 'Market Landscape',
      content: '• Global AUM reached $112T in 2024\n• Private equity outperforming public markets by 340bps\n• Emerging market exposure up 18% YoY',
      notes: 'Use the data points to frame the opportunity window.',
      layout: 'pinvest-content',
      emoji: '›',
    },
    {
      title: 'Portfolio Performance',
      content: '• Net IRR: 23.4% (vintage 2021–2024)\n• DPI: 1.6× across active funds\n• Top quartile vs. Cambridge Associates benchmark',
      notes: 'Highlight the IRR against benchmark. Have backup data ready.',
      layout: 'pinvest-content',
      emoji: '›',
    },
    {
      title: 'Investment Thesis',
      content: 'Targeting high-growth sectors with defensible moats\nFocus on Latin America and Iberian Peninsula\nOperational value creation at the core',
      notes: 'This is the core pitch — keep it tight and conviction-driven.',
      layout: 'pinvest-content',
      emoji: '›',
    },
    {
      title: 'Next Steps',
      content: 'Schedule Q1 portfolio review\nLP update call — February 14\nNew deal pipeline presentation to IC',
      notes: 'End with clear, actionable next steps for the committee.',
      layout: 'pinvest-closing',
      emoji: '›',
    },
  ],
}

// ── PINVEST LLC — BLACK TEMPLATE ──────────────────────────────────────────────
export const PINVEST_BLACK_TEMPLATE: SlideTemplate = {
  id: 'pinvest-black',
  name: 'Pinvest LLC — Black',
  description: 'Dark navy/black background — gold yellow accents, Cormorant Garamond',
  thumbnail: '/templates/pinvest-black-thumb.png',
  theme: 'pinvest' as any,
  accent: '#f5c800',
  font: 'Cormorant Garamond',
  isPremium: false,
  isCustom: true,
  sampleSlides: [
    {
      title: 'Investment Strategy Overview',
      content: 'Portfolio allocation across asset classes\nRisk-adjusted return targets for FY2025\nMarket positioning and thesis',
      notes: 'Open with strong market context. Reference recent Fed decisions.',
      layout: 'pinvest-title',
      emoji: '›',
    },
    {
      title: 'Market Landscape',
      content: '• Global AUM reached $112T in 2024\n• Private equity outperforming public markets by 340bps\n• Emerging market exposure up 18% YoY',
      notes: 'Use the data points to frame the opportunity window.',
      layout: 'pinvest-content',
      emoji: '›',
    },
    {
      title: 'Portfolio Performance',
      content: '• Net IRR: 23.4% (vintage 2021–2024)\n• DPI: 1.6× across active funds\n• Top quartile vs. Cambridge Associates benchmark',
      notes: 'Highlight the IRR against benchmark. Have backup data ready.',
      layout: 'pinvest-content',
      emoji: '›',
    },
    {
      title: 'Investment Thesis',
      content: 'Targeting high-growth sectors with defensible moats\nFocus on Latin America and Iberian Peninsula\nOperational value creation at the core',
      notes: 'This is the core pitch — keep it tight and conviction-driven.',
      layout: 'pinvest-content',
      emoji: '›',
    },
    {
      title: 'Next Steps',
      content: 'Schedule Q1 portfolio review\nLP update call — February 14\nNew deal pipeline presentation to IC',
      notes: 'End with clear, actionable next steps for the committee.',
      layout: 'pinvest-closing',
      emoji: '›',
    },
  ],
}

// ── OTHER TEMPLATES ───────────────────────────────────────────────────────────
export const BUILTIN_TEMPLATES: SlideTemplate[] = [
  PINVEST_WHITE_TEMPLATE,
  PINVEST_BLACK_TEMPLATE,
  {
    id: 'flowlog-clean',
    name: 'FlowLog Clean',
    description: 'Crisp white with green brand accent — for product demos and SaaS pitches',
    thumbnail: '/templates/flowlog-thumb.png',
    theme: 'light',
    accent: '#0ACF83',
    font: 'Syne',
    isCustom: true,
    sampleSlides: [
      { title: 'Product Overview', content: '• Core value proposition\n• Target market\n• Key differentiators', notes: '', layout: 'centered', emoji: '✦' },
      { title: 'The Problem', content: '• Pain point 1\n• Pain point 2\n• Cost of inaction', notes: '', layout: 'default', emoji: '🎯' },
      { title: 'Our Solution', content: '• How it works\n• Key features\n• Customer outcomes', notes: '', layout: 'default', emoji: '⚡' },
    ],
  },
  {
    id: 'dark-pro',
    name: 'Dark Pro',
    description: 'Dark background with vibrant accents — for tech, security, and developer audiences',
    thumbnail: '/templates/dark-thumb.png',
    theme: 'dark',
    accent: '#6366f1',
    font: 'Syne',
    sampleSlides: [
      { title: 'Technical Deep Dive', content: '• Architecture overview\n• Performance benchmarks\n• Security posture', notes: '', layout: 'centered', emoji: '🛡️' },
      { title: 'Key Metrics', content: '99.9% uptime\nSub-50ms response\n10M+ requests/day', notes: '', layout: 'default', emoji: '📊' },
    ],
  },
  {
    id: 'minimal-serif',
    name: 'Minimal Serif',
    description: 'Editorial elegance — ideal for thought leadership and consulting',
    thumbnail: '/templates/minimal-thumb.png',
    theme: 'minimal',
    accent: '#0d0f0e',
    font: 'Playfair Display',
    sampleSlides: [
      { title: 'Executive Summary', content: 'The strategic imperative\nFindings and implications\nRecommended path forward', notes: '', layout: 'centered', emoji: '' },
    ],
  },
]

export function getTemplateById(id: string): SlideTemplate | undefined {
  return BUILTIN_TEMPLATES.find(t => t.id === id)
}
