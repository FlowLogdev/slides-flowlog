// src/lib/themes.ts
import { SlideTheme } from './types'

export interface ThemeDefinition {
  id: string
  label: string
  slideBackground: string
  canvasBackground: string
  titleColor: string
  contentColor: string
  accentOverride?: string
  fontOverride?: string
  headerBackground?: string
  footerColor?: string
  borderColor?: string
  watermark?: string
}

export const THEMES: Record<string, ThemeDefinition> = {
  light: {
    id: 'light',
    label: 'Light',
    slideBackground: '#ffffff',
    canvasBackground: '#e8ecea',
    titleColor: '#0d0f0e',
    contentColor: '#3a3d3b',
  },
  dark: {
    id: 'dark',
    label: 'Dark',
    slideBackground: '#0d0f0e',
    canvasBackground: '#1a1d1b',
    titleColor: '#f5f7f6',
    contentColor: '#9ba09d',
  },
  gradient: {
    id: 'gradient',
    label: 'Gradient',
    slideBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    canvasBackground: '#2a1a4a',
    titleColor: '#ffffff',
    contentColor: 'rgba(255,255,255,0.85)',
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    slideBackground: '#fafafa',
    canvasBackground: '#f0f0ef',
    titleColor: '#0d0f0e',
    contentColor: '#6b6e6c',
  },
  // ── Pinvest LLC — Black (dark navy background) ──
  pinvest: {
    id: 'pinvest',
    label: 'Pinvest LLC — Black',
    slideBackground: '#0d1120',
    canvasBackground: '#080a10',
    titleColor: '#ffffff',
    contentColor: '#c8cfe0',
    accentOverride: '#f5c800',
    fontOverride: 'Cormorant Garamond',
    headerBackground: '#0d1120',
    footerColor: '#f5c800',
    borderColor: 'rgba(245,200,0,0.3)',
    watermark: 'PINVEST LLC',
  },
  // ── Pinvest LLC — White (clean white background) ──
  'pinvest-white': {
    id: 'pinvest-white',
    label: 'Pinvest LLC — White',
    slideBackground: '#ffffff',
    canvasBackground: '#e8eaef',
    titleColor: '#1a3a6b',
    contentColor: '#2e4a7a',
    accentOverride: '#f5c800',
    fontOverride: 'Cormorant Garamond',
    headerBackground: '#ffffff',
    footerColor: '#1a3a6b',
    borderColor: 'rgba(26,58,107,0.15)',
    watermark: 'PINVEST LLC',
  },
}

export function getTheme(id: string): ThemeDefinition {
  return THEMES[id] ?? THEMES.light
}
