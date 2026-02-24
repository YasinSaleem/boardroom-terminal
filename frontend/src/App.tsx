import React, { useEffect, useState } from 'react'
import { useBoardroom } from './hooks/useBoardroom'
import Dossiers from './components/Dossiers'
import TheRoster from './components/TheRoster'
import Transcript from './components/Transcript'
import CommandBar from './components/CommandBar'
import AuthScreen from './components/AuthScreen'
import {
  clearAuthToken,
  fetchMe,
  getAuthToken,
  login,
  setAuthToken,
  signup,
} from './api'
import type { AuthUser } from './types'

const App: React.FC = () => {
  const [authLoading, setAuthLoading] = useState(true)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)

  const {
    agents,
    sessions,
    messages,
    activeSessionId,
    activeAgentId,
    isTyping,
    setActiveSessionId,
    setActiveAgentId,
    startNewSession,
    submitMessage,
    getAgent,
  } = useBoardroom(Boolean(authUser))

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      setAuthLoading(false)
      return
    }

    fetchMe()
      .then((user) => {
        setAuthUser(user)
      })
      .catch(() => {
        clearAuthToken()
        setAuthUser(null)
      })
      .finally(() => {
        setAuthLoading(false)
      })
  }, [])

  async function handleLogin(email: string, password: string) {
    const result = await login({ email, password })
    if (!result.access_token) {
      throw new Error('Login failed: no access token returned')
    }
    setAuthToken(result.access_token)
    setAuthUser(result.user)
  }

  async function handleSignup(email: string, password: string) {
    const result = await signup({ email, password })
    if (result.requires_email_confirmation || !result.access_token) {
      throw new Error('Signup succeeded, but email confirmation is required before login.')
    }
    setAuthToken(result.access_token)
    setAuthUser(result.user)
  }

  function handleLogout() {
    clearAuthToken()
    setAuthUser(null)
  }

  if (authLoading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: 'var(--color-canvas)',
          color: 'var(--color-text-muted)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div className="label-meta">Initializing Dossier...</div>
      </div>
    )
  }

  if (!authUser) {
    return <AuthScreen onLogin={handleLogin} onSignup={handleSignup} />
  }

  const activeAgent = getAgent(activeAgentId)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr 280px',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--color-canvas)',
      }}
    >
      {/* Film grain */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Left pane: Dossiers */}
      <Dossiers
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={startNewSession}
      />

      {/* Center pane: Transcript */}
      <main
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: 'var(--color-canvas)',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            padding: '20px 40px 12px',
            borderBottom: '1px solid var(--color-divider)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span className="label-meta">The Transcript</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeAgent && (
              <span
                className="label-meta"
                style={{ color: activeAgent.color_hex }}
              >
                {activeAgent.name} Active
              </span>
            )}
            <span className="label-meta" style={{ color: 'var(--color-text-muted)' }}>
              {authUser.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                border: '1px solid var(--color-divider)',
                background: 'transparent',
                color: 'var(--color-text-primary)',
                borderRadius: '2px',
                padding: '3px 8px',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Messages */}
        <Transcript
          messages={messages}
          isTyping={isTyping}
          getAgent={getAgent}
          activeAgentColor={activeAgent?.color_hex}
        />

        {/* Floating command bar */}
        <CommandBar
          activeAgent={activeAgent}
          isTyping={isTyping}
          onSubmit={submitMessage}
        />
      </main>

      {/* Right pane: The Roster */}
      <TheRoster
        agents={agents}
        activeAgentId={activeAgentId}
        isTyping={isTyping}
        onSelectAgent={setActiveAgentId}
      />
    </div>
  )
}

export default App
