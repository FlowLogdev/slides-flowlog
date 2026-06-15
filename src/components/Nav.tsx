'use client'
import { Screen } from '@/components/AppShell'
import styles from './Nav.module.css'

interface NavProps {
  screen: Screen
  onNavigate: (s: Screen) => void
  onNewPresentation: () => void
  userEmail?: string
  onLogout?: () => void
}

export default function Nav({ screen, onNavigate, onNewPresentation, userEmail, onLogout }: NavProps) {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo} onClick={() => onNavigate('home')}>
        <div className={styles.logoDot}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="white">
            <path d="M8 1L14 12H2L8 1Z"/>
          </svg>
        </div>
        slides<span className={styles.logoAccent}>.flowlog</span>
      </div>
      <div className={styles.actions}>
        {screen === 'editor' && (
          <button className={styles.btnGhost} onClick={() => onNavigate('home')}>
            ← All presentations
          </button>
        )}
        {screen !== 'home' && screen !== 'create' && (
          <button className={styles.btnGhost} onClick={() => onNavigate('home')}>Home</button>
        )}
        {userEmail && (
          <span style={{ fontSize: 12.5, color: 'var(--ink4)', fontFamily: 'var(--font-body)', userSelect: 'none' }}>
            {userEmail}
          </span>
        )}
        <button className={styles.btnPrimary} onClick={onNewPresentation}>
          ✦ New Presentation
        </button>
        {onLogout && (
          <button className={styles.btnGhost} onClick={onLogout} title="Log out">
            ↩
          </button>
        )}
      </div>
    </nav>
  )
}
