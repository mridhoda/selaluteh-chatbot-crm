-- Migration: Add ai_settings column to agents table
-- Purpose: Support custom per-agent OpenAI-compatible configurations (base URL, API Key, Model, etc.)

ALTER TABLE agents ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{}'::jsonb;
