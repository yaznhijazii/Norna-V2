-- Add podcast_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS podcast_id TEXT;

-- Update RLS to allow users to update their own podcast_id
-- (This should already be covered by the existing general update policy on users table,
-- but adding column-specific comments for clarity)

COMMENT ON COLUMN users.podcast_id IS 'Store the YouTube Video ID for the weekly podcast';
