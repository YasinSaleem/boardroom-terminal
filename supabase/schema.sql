-- Run this in the Supabase SQL Editor

-- Agents Table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role_description TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    color_hex VARCHAR(7) NOT NULL
);

-- Sessions Table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Session',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX idx_sessions_user_id_updated_at ON sessions(user_id, updated_at DESC);

-- Messages Table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Seed Agents
INSERT INTO agents (name, role_description, system_prompt, color_hex) VALUES
('Senior Architect',
 'System design & scalable architecture expert.',
 'You are a Senior Systems Architect. Speak with precision regarding infrastructure, scalability, and code structure. Be concise, technical, and authoritative.',
 '#3B82F6'),

('Product Manager',
 'Vision, user flow, and feature prioritization.',
 'You are a Product Manager. Focus on UX, user value, metrics, and go-to-market strategy. Think in terms of outcomes, not outputs.',
 '#8B5CF6'),

('Security Auditor',
 'Vulnerability assessment & secure practices.',
 'You are a strict Security Auditor. Hunt for vulnerabilities, auth flaws, and data leaks in the proposed ideas. Be blunt about risks.',
 '#EF4444');
