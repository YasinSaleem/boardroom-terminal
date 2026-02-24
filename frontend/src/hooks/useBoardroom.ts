import { useState, useEffect, useCallback } from 'react'
import type { Agent, Session, Message } from '../types'
import {
  fetchAgents,
  fetchSessions,
  createSession,
  fetchMessages,
  sendMessage,
} from '../api'

interface BoardroomState {
  agents: Agent[]
  sessions: Session[]
  messages: Message[]
  activeSessionId: string | null
  activeAgentId: string | null
  isTyping: boolean
  error: string | null
  setActiveSessionId: (id: string) => void
  setActiveAgentId: (id: string) => void
  startNewSession: () => Promise<void>
  submitMessage: (text: string) => Promise<void>
  getAgent: (id: string | null) => Agent | undefined
}

export function useBoardroom(enabled = true): BoardroomState {
  const [agents, setAgents] = useState<Agent[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null)
  const [activeAgentId, setActiveAgentIdState] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bootstrap: load agents and sessions independently so one failure can't
  // block the other.
  useEffect(() => {
    if (!enabled) return

    fetchAgents()
      .then((ag) => {
        setAgents(ag)
        if (ag.length > 0) setActiveAgentIdState(ag[0].id)
      })
      .catch((err) => {
        const msg = err?.response?.data?.error ?? err?.message ?? 'Failed to fetch agents'
        console.error('[useBoardroom] fetchAgents failed:', err)
        setError(msg)
      })

    fetchSessions()
      .then(async (sess) => {
        if (sess.length > 0) {
          setSessions(sess)
          setActiveSessionIdState(sess[0].id)
          return
        }

        // If no prior sessions exist, auto-create one for first-time entry.
        const newSession = await createSession()
        setSessions([newSession])
        setActiveSessionIdState(newSession.id)
      })
      .catch((err) => {
        console.error('[useBoardroom] fetchSessions failed:', err)
        // Non-fatal — app still usable with 0 sessions
      })
  }, [enabled])

  // Load messages when active session changes
  useEffect(() => {
    if (!enabled) {
      setMessages([])
      return
    }

    if (!activeSessionId) {
      setMessages([])
      return
    }
    fetchMessages(activeSessionId)
      .then(setMessages)
      .catch((err) => {
        console.error('[useBoardroom] fetchMessages failed:', err)
      })
  }, [activeSessionId, enabled])

  const setActiveSessionId = useCallback((id: string) => {
    setActiveSessionIdState(id)
  }, [])

  const setActiveAgentId = useCallback((id: string) => {
    setActiveAgentIdState(id)
  }, [])

  const startNewSession = useCallback(async () => {
    try {
      const session = await createSession()
      setSessions((prev) => [session, ...prev])
      setActiveSessionIdState(session.id)
      setMessages([])
    } catch (err) {
      console.error('[useBoardroom] createSession failed:', err)
    }
  }, [])

  const streamAssistantMessage = useCallback(
    async (assistantText: string, agentId: string) => {
      const streamingId = `streaming-${Date.now()}`
      const startedAt = new Date().toISOString()

      // Seed an empty assistant message in the transcript.
      setMessages((prev) => [
        ...prev,
        {
          id: streamingId,
          role: 'assistant',
          content: '',
          agent_id: agentId,
          created_at: startedAt,
        },
      ])

      // Fast typewriter reveal.
      const chunkSize = 3
      const tickMs = 12
      let cursor = 0

      await new Promise<void>((resolve) => {
        const timer = window.setInterval(() => {
          cursor = Math.min(cursor + chunkSize, assistantText.length)
          const partial = assistantText.slice(0, cursor)

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingId
                ? { ...msg, content: partial }
                : msg
            )
          )

          if (cursor >= assistantText.length) {
            window.clearInterval(timer)
            resolve()
          }
        }, tickMs)
      })
    },
    []
  )

  const submitMessage = useCallback(
    async (text: string) => {
      if (!activeSessionId || !activeAgentId || !text.trim()) return

      // Optimistic user message
      const optimisticUserMsg: Message = {
        id: `optimistic-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        agent_id: null,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, optimisticUserMsg])
      setIsTyping(true)

      try {
        const { message: assistantMsg } = await sendMessage({
          session_id: activeSessionId,
          agent_id: activeAgentId,
          message: text.trim(),
        })

        setIsTyping(false)

        await streamAssistantMessage(assistantMsg.content, activeAgentId)

        // Refresh from server to get correct IDs / timestamps
        const refreshed = await fetchMessages(activeSessionId)
        setMessages(refreshed)

        // Bubble this session to the top
        setSessions((prev) => {
          const timestamp = assistantMsg.created_at ?? new Date().toISOString()
          const updated = prev.map((s) =>
            s.id === activeSessionId ? { ...s, updated_at: timestamp } : s
          )
          return [
            updated.find((s) => s.id === activeSessionId)!,
            ...updated.filter((s) => s.id !== activeSessionId),
          ]
        })
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } }; message?: string }
        const msg = axiosErr?.response?.data?.error ?? axiosErr?.message ?? 'Request failed'
        console.error('[useBoardroom] submitMessage failed:', err)
        setError(msg)
        // Remove the optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id))
      } finally {
        setIsTyping(false)
      }
    },
    [activeSessionId, activeAgentId, streamAssistantMessage]
  )

  const getAgent = useCallback(
    (id: string | null) => {
      if (!id) return undefined
      return agents.find((a) => a.id === id)
    },
    [agents]
  )

  return {
    agents,
    sessions,
    messages,
    activeSessionId,
    activeAgentId,
    isTyping,
    error,
    setActiveSessionId,
    setActiveAgentId,
    startNewSession,
    submitMessage,
    getAgent,
  }
}
