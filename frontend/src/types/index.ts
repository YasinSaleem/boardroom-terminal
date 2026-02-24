// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface Agent {
  id: string
  name: string
  role_description: string
  color_hex: string
}

export interface Session {
  id: string
  title: string
  updated_at: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agent_id: string | null
  created_at: string
}

export interface AuthUser {
  id: string
  email: string
}

// ---------------------------------------------------------------------------
// API request/response shapes
// ---------------------------------------------------------------------------

export interface ChatPayload {
  session_id: string
  agent_id: string
  message: string
}

export interface ChatResponse {
  message: Omit<Message, 'created_at'> & { created_at?: string }
}

export interface AuthPayload {
  email: string
  password: string
}

export interface AuthResponse {
  user: AuthUser
  access_token?: string
  requires_email_confirmation?: boolean
}
