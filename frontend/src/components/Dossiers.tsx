import React from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { Session } from '../types'

interface DossiersProps {
  sessions: Session[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onNewSession: () => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

const Dossiers: React.FC<DossiersProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
}) => {
  return (
    <aside
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-divider)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 16px 12px',
          borderBottom: '1px solid var(--color-divider)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span className="label-meta">Dossiers</span>
        <button
          onClick={onNewSession}
          title="New session"
          style={{
            background: 'none',
            border: '1px solid var(--color-divider)',
            borderRadius: '2px',
            cursor: 'pointer',
            padding: '3px 5px',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--color-text-muted)',
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-divider)'
          }}
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Session list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {sessions.length === 0 && (
          <p
            style={{
              padding: '16px',
              color: 'var(--color-text-muted)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            No sessions yet.
          </p>
        )}
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId
          return (
            <motion.button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                background: isActive ? 'rgba(255,255,255,0.04)' : 'none',
                border: 'none',
                borderLeft: isActive
                  ? '2px solid rgba(255,255,255,0.25)'
                  : '2px solid transparent',
                borderRadius: 0,
                cursor: 'pointer',
                padding: '10px 14px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  fontWeight: isActive ? 500 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  display: 'block',
                }}
              >
                {session.title}
              </span>
              <span
                className="label-meta"
                style={{ fontSize: '9px' }}
              >
                {formatDate(session.updated_at)}
              </span>
            </motion.button>
          )
        })}
      </div>
    </aside>
  )
}

export default Dossiers
