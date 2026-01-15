-- 1. Add Mood Support to Users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_mood TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mood_updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create Podcast Highlights table
CREATE TABLE IF NOT EXISTS podcast_highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    podcast_id TEXT, -- YouTube Video ID
    content TEXT NOT NULL,
    is_shared BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for podcast_highlights
ALTER TABLE podcast_highlights ENABLE ROW LEVEL SECURITY;

-- Policies for podcast_highlights
CREATE POLICY "Users can manage their own highlights"
    ON podcast_highlights FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view partner's shared highlights"
    ON podcast_highlights FOR SELECT
    USING (
        is_shared = true AND 
        user_id IN (
            SELECT partner_id FROM users WHERE id = auth.uid()
        )
    );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_highlights_user ON podcast_highlights(user_id);
