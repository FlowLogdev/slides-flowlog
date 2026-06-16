// src/app/layout.tsx
/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'slides.flowlog.dev — AI Presentation Builder',
  description: 'Generate premium, export-ready slide decks with AI. PPTX, PDF, HTML exports. Includes Pinvest Capital template.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@300;400;500;700&family=Montserrat:wght@300;400;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
