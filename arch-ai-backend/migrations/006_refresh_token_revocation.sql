-- TASK-SEC-001: Refresh Token Revocation
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR(255);
