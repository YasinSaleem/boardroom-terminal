import React from 'react'
import { motion } from 'framer-motion'
import type { Agent } from '../types'

interface TheRosterProps {
  agents: Agent[]
  activeAgentId: string | null
  isTyping: boolean
  onSelectAgent: (id: string) => void
}

const TheRoster: React.FC<TheRosterProps> = ({
  agents,
  activeAgentId,
  isTyping,
  onSelectAgent,
}) => {
  const activeAgent = agents.find((a) => a.id === activeAgentId)

  return (
    <aside
      style={{
        backgroundColor: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-divider)',
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
        }}
      >
        <span className="label-meta">The Roster</span>
      </div>

      {/* Active agent detail */}
      {activeAgent && (
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid var(--color-divider)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            {/* Status dot */}
            <motion.span
              animate={
                isTyping
                  ? { opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }
                  : { opacity: 1, scale: 1 }
              }
              transition={
                isTyping
                  ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.3 }
              }
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: activeAgent.color_hex,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
              }}
            >
              {activeAgent.name}
            </span>
          </div>

          <p
            style={{
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
            }}
          >
            {activeAgent.role_description}
          </p>

          <div style={{ marginTop: '12px' }}>
            <span className="label-meta" style={{ display: 'block', marginBottom: '4px' }}>
              System Status
            </span>
            <span
              style={{
                fontSize: '11px',
                color: isTyping ? activeAgent.color_hex : 'var(--color-text-muted)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {isTyping ? 'PROCESSING...' : 'STANDBY'}
            </span>
          </div>
        </div>
      )}

      {/* Agent list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <div style={{ padding: '12px 16px 6px' }}>
          <span className="label-meta">Select Agent</span>
        </div>
        {agents.map((agent) => {
          const isActive = agent.id === activeAgentId
          return (
            <motion.button
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                background: isActive ? 'rgba(255,255,255,0.03)' : 'none',
                border: 'none',
                borderLeft: isActive
                  ? `2px solid ${agent.color_hex}`
                  : '2px solid transparent',
                borderRadius: 0,
                cursor: 'pointer',
                padding: '10px 14px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? agent.color_hex : 'var(--color-text-muted)',
                  flexShrink: 0,
                  opacity: isActive ? 1 : 0.5,
                }}
              />
              <span
                style={{
                  fontSize: '12px',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {agent.name}
              </span>
            </motion.button>
          )
        })}
      </div>
    </aside>
  )
}

export default TheRoster
