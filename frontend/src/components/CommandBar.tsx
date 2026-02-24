import React, { useState, useRef, useCallback } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Agent } from '../types'

interface CommandBarProps {
  activeAgent: Agent | undefined
  isTyping: boolean
  onSubmit: (text: string) => void
}

const CommandBar: React.FC<CommandBarProps> = ({ activeAgent, isTyping, onSubmit }) => {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    // Auto-expand
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  const submit = useCallback(() => {
    if (!value.trim() || isTyping) return
    onSubmit(value.trim())
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, isTyping, onSubmit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        submit()
      }
    },
    [submit]
  )

  const hasText = value.trim().length > 0

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '40px',
        right: '40px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(10, 10, 10, 0.6)',
        border: '1px solid var(--color-divider)',
        borderRadius: '4px',
        zIndex: 10,
        padding: '12px 16px',
      }}
    >
      {/* Addressing line */}
      {activeAgent && (
        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: activeAgent.color_hex,
              flexShrink: 0,
            }}
          />
          <span
            className="label-meta"
            style={{ color: activeAgent.color_hex }}
          >
            Addressing: {activeAgent.name}
          </span>
        </div>
      )}

      {/* Input row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={isTyping ? 'Agent is processing...' : 'Enter directive. Shift+Enter for new line.'}
          disabled={isTyping}
          rows={1}
          style={{
            flex: 1,
            minHeight: '24px',
            maxHeight: '200px',
            overflow: 'auto',
            color: isTyping ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
          }}
        />
        <button
          onClick={submit}
          disabled={!hasText || isTyping}
          title="Send (Enter)"
          style={{
            background: 'none',
            border: 'none',
            borderRadius: '2px',
            cursor: hasText && !isTyping ? 'pointer' : 'default',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            color: hasText && !isTyping ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            flexShrink: 0,
            transition: 'color 0.2s',
            opacity: hasText && !isTyping ? 1 : 0.4,
          }}
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default CommandBar
