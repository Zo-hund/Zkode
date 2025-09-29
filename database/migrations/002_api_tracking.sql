-- Migration 002: API Usage Tracking and Rate Limiting
-- Adds tables for monitoring and rate limiting

-- API usage tracking
CREATE TABLE api_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    model_used TEXT,
    tokens_used INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    status_code INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Rate limiting
CREATE TABLE rate_limits (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL, -- user_id or ip_address
    endpoint TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, endpoint)
);

-- Indexes for performance
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX idx_rate_limits_window_start ON rate_limits(window_start);