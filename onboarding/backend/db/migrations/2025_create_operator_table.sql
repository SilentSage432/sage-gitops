--------------------------------------------------------------
-- Create operators table for WebAuthn credential storage
-- This table stores operator credentials for hardware identity
--------------------------------------------------------------

CREATE TABLE IF NOT EXISTS operators (
    name TEXT PRIMARY KEY,
    credential TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

