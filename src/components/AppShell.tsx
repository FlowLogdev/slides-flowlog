'use client'
import { useState } from 'react'
import Nav from '@/components/Nav'
import HomeScreen from '@/components/home/HomeScreen'
import CreateScreen from '@/components/create/CreateScreen'
import GeneratingScreen from '@/components/create/GeneratingScreen'
import EditorScreen from '@/components/editor/EditorScreen'
import { CreationMode } from '@/lib/types'

export type Screen = 'home' | 'create' | 'generating' | 'editor'

interface Props {
  userEmail: string
}

export default function AppShell({ userEmail }: Props) {
  const [screen, setScreen] = useState<Screen>('home')
  const [createMode, setCreateMode] = useState<CreationMode>('generate')

  function goCreate(mode: CreationMode) {
    setCreateMode(mode)
    setScreen('create')
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.reload()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Nav
        screen={screen}
        onNavigate={setScreen}
        onNewPresentation={() => goCreate('generate')}
        userEmail={userEmail}
        onLogout={handleLogout}
      />
      {screen === 'home' && <HomeScreen onNavigate={setScreen} onCreate={goCreate} />}
      {screen === 'create' && <CreateScreen mode={createMode} onModeChange={setCreateMode} onNavigate={setScreen} />}
      {screen === 'generating' && <GeneratingScreen onNavigate={setScreen} />}
      {screen === 'editor' && <EditorScreen onNavigate={setScreen} />}
    </div>
  )
}
