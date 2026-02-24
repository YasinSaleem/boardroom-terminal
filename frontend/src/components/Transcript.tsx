import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import type { Message, Agent } from '../types'

interface TranscriptProps {
  messages: Message[]
  isTyping: boolean
  getAgent: (id: string | null) => Agent | undefined
  activeAgentColor?: string
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}:${ms}`
}

const MSG_VARIANTS = {
  hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

const Transcript: React.FC<TranscriptProps> = ({
  messages,
  isTyping,
  getAgent,
  activeAgentColor,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingColor = activeAgentColor ?? 'var(--color-accent-architect)'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px 40px 160px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}
    >
      {messages.length === 0 && !isTyping && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '12px',
            opacity: 0.4,
          }}
        >
          <span className="label-meta" style={{ fontSize: '11px' }}>
            The Boardroom
          </span>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              maxWidth: '320px',
              lineHeight: 1.7,
            }}
          >
            Select an agent from the Roster and begin your strategic session.
          </p>
        </div>
      )}

      <AnimatePresence initial={false}>
        {messages.map((msg) => {
          const agent = msg.role === 'assistant' ? getAgent(msg.agent_id) : undefined
          const borderColor =
            msg.role === 'user'
              ? 'var(--color-accent-user)'
              : agent?.color_hex ?? 'var(--color-accent-architect)'

          const senderLabel =
            msg.role === 'user' ? 'You' : agent?.name ?? 'Assistant'

          return (
            <motion.div
              key={msg.id}
              variants={MSG_VARIANTS}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                borderLeft: `${msg.role === 'user' ? '1px' : '2px'} solid ${borderColor}`,
                paddingLeft: '16px',
                marginLeft: msg.role === 'user' ? '48px' : '0',
              }}
            >
              {/* Metadata header */}
              <div style={{ marginBottom: '8px' }}>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {senderLabel} &bull; {formatTime(msg.created_at)}
                </span>
              </div>

              {/* Content */}
              <div className="prose-terminal">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Typing indicator */}
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            borderLeft: `2px solid ${typingColor}`,
            paddingLeft: '16px',
          }}
        >
          <div style={{ marginBottom: '8px' }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: typingColor,
              }}
            >
              Processing...
            </span>
          </div>
          <TypingDots color={typingColor} />
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

function TypingDots({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', height: '20px' }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
          style={{
            display: 'inline-block',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  )
}

export default Transcript
