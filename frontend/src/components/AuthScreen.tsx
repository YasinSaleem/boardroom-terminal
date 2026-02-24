import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

interface AuthScreenProps {
  loading?: boolean
  onLogin: (email: string, password: string) => Promise<void>
  onSignup: (email: string, password: string) => Promise<void>
}

type Mode = 'login' | 'signup'

const AuthScreen: React.FC<AuthScreenProps> = ({ loading = false, onLogin, onSignup }) => {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const title = useMemo(() => (mode === 'login' ? 'Access Dossier' : 'New Operator'), [mode])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }

    try {
      if (mode === 'login') {
        await onLogin(email.trim(), password)
      } else {
        await onSignup(email.trim(), password)
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } }; message?: string }
      setError(apiErr?.response?.data?.error ?? apiErr?.message ?? 'Authentication failed')
    }
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--color-canvas)',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div className="noise-overlay" aria-hidden="true" />
      <div className="auth-grid-overlay" aria-hidden="true" />
      <div className="auth-rings" aria-hidden="true" />
      <div className="auth-scanline" aria-hidden="true" />

      <motion.section
        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: 'min(560px, 92vw)',
          border: '1px solid var(--color-divider)',
          background: 'var(--color-surface)',
          borderRadius: '4px',
          padding: '20px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <span className="label-meta">The Boardroom</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setMode('login')}
              style={{
                border: '1px solid var(--color-divider)',
                background: mode === 'login' ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: 'var(--color-text-primary)',
                borderRadius: '2px',
                padding: '4px 8px',
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              disabled={loading}
            >
              Login
            </button>
            <button
              onClick={() => setMode('signup')}
              style={{
                border: '1px solid var(--color-divider)',
                background: mode === 'signup' ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: 'var(--color-text-primary)',
                borderRadius: '2px',
                padding: '4px 8px',
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              disabled={loading}
            >
              Sign Up
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <p
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--color-text-muted)',
            }}
          >
            {title}
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'grid', gap: '10px' }}>
          <label style={{ display: 'grid', gap: '4px' }}>
            <span className="label-meta">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{
                border: '1px solid var(--color-divider)',
                background: 'transparent',
                color: 'var(--color-text-primary)',
                borderRadius: '2px',
                padding: '10px 12px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: '4px' }}>
            <span className="label-meta">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{
                border: '1px solid var(--color-divider)',
                background: 'transparent',
                color: 'var(--color-text-primary)',
                borderRadius: '2px',
                padding: '10px 12px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </label>

          {error && (
            <div
              style={{
                borderLeft: '2px solid var(--color-accent-security)',
                paddingLeft: '10px',
                color: 'var(--color-text-muted)',
                fontSize: '12px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              border: '1px solid var(--color-divider)',
              background: loading ? 'rgba(255,255,255,0.04)' : 'transparent',
              color: 'var(--color-text-primary)',
              borderRadius: '2px',
              padding: '10px 12px',
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: loading ? 'default' : 'pointer',
              marginTop: '6px',
            }}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Enter Boardroom' : 'Create Account'}
          </button>
        </form>
      </motion.section>
    </div>
  )
}

export default AuthScreen
