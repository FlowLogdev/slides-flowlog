// src/lib/store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Presentation, Slide, SlideTheme, ExportFormat } from './types'

interface AppState {
  // Active presentation
  presentation: Presentation | null
  currentSlideIndex: number

  // UI state
  isGenerating: boolean
  loadingStep: number
  generationTitle: string
  generationPreviewSlides: Slide[]
  generationActiveSlide: number
  generationStatus: string
  activeTab: 'edit' | 'design' | 'layout' | 'export'
  selectedTemplateId: string | null

  // Saved presentations
  savedPresentations: Presentation[]

  // Actions
  setPresentation: (p: Presentation) => void
  updateSlide: (index: number, updates: Partial<Slide>) => void
  addSlide: (after?: number) => void
  removeSlide: (index: number) => void
  reorderSlides: (from: number, to: number) => void
  setCurrentSlide: (index: number) => void
  setTheme: (theme: SlideTheme) => void
  setAccent: (color: string) => void
  setFont: (font: string) => void
  setIsGenerating: (v: boolean) => void
  setLoadingStep: (step: number) => void
  resetGenerationPreview: (title?: string) => void
  setGenerationStatus: (status: string) => void
  setGenerationActiveSlide: (index: number) => void
  setGenerationPreviewSlides: (slides: Slide[]) => void
  updateGenerationPreviewSlide: (index: number, updates: Partial<Slide>) => void
  setActiveTab: (tab: 'edit' | 'design' | 'layout' | 'export') => void
  savePresentation: () => void
  loadPresentation: (id: string) => void
  deletePresentation: (id: string) => void
}

const newSlide = (overrides?: Partial<Slide>): Slide => ({
  id: Math.random().toString(36).slice(2),
  title: 'New Slide',
  content: 'Add your content here\nAnother key point',
  notes: '',
  layout: 'default',
  emoji: '📌',
  ...overrides,
})

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      presentation: null,
      currentSlideIndex: 0,
      isGenerating: false,
      loadingStep: 0,
      generationTitle: '',
      generationPreviewSlides: [],
      generationActiveSlide: 0,
      generationStatus: '',
      activeTab: 'edit',
      selectedTemplateId: null,
      savedPresentations: [],

      setPresentation: (p) => set({ presentation: p, currentSlideIndex: 0 }),

      updateSlide: (index, updates) => set(state => {
        if (!state.presentation) return state
        const slides = [...state.presentation.slides]
        slides[index] = { ...slides[index], ...updates }
        return { presentation: { ...state.presentation, slides, updatedAt: Date.now() } }
      }),

      addSlide: (after) => set(state => {
        if (!state.presentation) return state
        const slides = [...state.presentation.slides]
        const insertAt = after !== undefined ? after + 1 : slides.length
        slides.splice(insertAt, 0, newSlide())
        return {
          presentation: { ...state.presentation, slides, updatedAt: Date.now() },
          currentSlideIndex: insertAt,
        }
      }),

      removeSlide: (index) => set(state => {
        if (!state.presentation || state.presentation.slides.length <= 1) return state
        const slides = state.presentation.slides.filter((_, i) => i !== index)
        const next = Math.min(index, slides.length - 1)
        return {
          presentation: { ...state.presentation, slides, updatedAt: Date.now() },
          currentSlideIndex: next,
        }
      }),

      reorderSlides: (from, to) => set(state => {
        if (!state.presentation) return state
        const slides = [...state.presentation.slides]
        const [moved] = slides.splice(from, 1)
        slides.splice(to, 0, moved)
        return { presentation: { ...state.presentation, slides, updatedAt: Date.now() } }
      }),

      setCurrentSlide: (index) => set({ currentSlideIndex: index }),
      setTheme: (theme) => set(state => state.presentation ? { presentation: { ...state.presentation, theme } } : state),
      setAccent: (accent) => set(state => state.presentation ? { presentation: { ...state.presentation, accent } } : state),
      setFont: (font) => set(state => state.presentation ? { presentation: { ...state.presentation, font } } : state),
      setIsGenerating: (v) => set({ isGenerating: v }),
      setLoadingStep: (step) => set({ loadingStep: step }),
      resetGenerationPreview: (title = '') => set({
        generationTitle: title,
        generationPreviewSlides: [],
        generationActiveSlide: 0,
        generationStatus: 'Preparing deck',
      }),
      setGenerationStatus: (generationStatus) => set({ generationStatus }),
      setGenerationActiveSlide: (generationActiveSlide) => set({ generationActiveSlide }),
      setGenerationPreviewSlides: (generationPreviewSlides) => set({ generationPreviewSlides }),
      updateGenerationPreviewSlide: (index, updates) => set(state => {
        const slides = [...state.generationPreviewSlides]
        slides[index] = { ...slides[index], ...updates }
        return { generationPreviewSlides: slides, generationActiveSlide: index }
      }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      savePresentation: () => set(state => {
        if (!state.presentation) return state
        const existing = state.savedPresentations.findIndex(p => p.id === state.presentation!.id)
        const saved = [...state.savedPresentations]
        if (existing >= 0) saved[existing] = state.presentation
        else saved.unshift(state.presentation)
        return { savedPresentations: saved.slice(0, 50) }
      }),

      loadPresentation: (id) => set(state => {
        const p = state.savedPresentations.find(p => p.id === id)
        if (!p) return state
        return { presentation: p, currentSlideIndex: 0 }
      }),

      deletePresentation: (id) => set(state => ({
        savedPresentations: state.savedPresentations.filter(p => p.id !== id)
      })),
    }),
    {
      name: 'slides-flowlog-store',
      partialize: (state) => ({ savedPresentations: state.savedPresentations }),
    }
  )
)
