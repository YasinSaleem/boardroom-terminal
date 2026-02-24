import axios from 'axios'
import type {
  Agent,
  Session,
  Message,
  ChatPayload,
  ChatResponse,
  AuthPayload,
  AuthResponse,
  AuthUser,
} from './types'

const http = axios.create({ baseURL: '/api' })
const TOKEN_STORAGE_KEY = 'boardroom_access_token'

http.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export async function signup(payload: AuthPayload): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/signup', payload)
  return data
}

export async function login(payload: AuthPayload): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/login', payload)
  return data
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await http.get<{ user: AuthUser }>('/auth/me')
  return data.user
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
export async function fetchSessions(): Promise<Session[]> {
  const { data } = await http.get<Session[]>('/sessions')
  return data
}

export async function createSession(): Promise<Session> {
  const { data } = await http.post<Session>('/sessions')
  return data
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
export async function fetchMessages(sessionId: string): Promise<Message[]> {
  const { data } = await http.get<Message[]>(`/sessions/${sessionId}/messages`)
  return data
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------
export async function fetchAgents(): Promise<Agent[]> {
  const { data } = await http.get<Agent[]>('/agents')
  return data
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------
export async function sendMessage(payload: ChatPayload): Promise<ChatResponse> {
  const { data } = await http.post<ChatResponse>('/chat', payload)
  return data
}
