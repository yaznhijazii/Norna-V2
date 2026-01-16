-- ============================================
-- PERFORMANCE OPTIMIZATION - SIMPLIFIED VERSION
-- ============================================
-- Safe to run in Supabase SQL Editor
-- No VACUUM commands (run those manually if needed)
-- ============================================

-- ============================================
-- 1. CREATE INDEXES
-- ============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id) WHERE partner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);
CREATE INDEX IF NOT EXISTS idx_users_streak ON users(streak_count DESC);

-- Gifts table indexes (Critical for Partner Page)
CREATE INDEX IF NOT EXISTS idx_gifts_from_user ON gifts(from_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gifts_to_user ON gifts(to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gifts_partner_pair ON gifts(from_user_id, to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gifts_created_at ON gifts(created_at DESC);

-- Direct Messages indexes
CREATE INDEX IF NOT EXISTS idx_direct_messages_from ON direct_messages(from_user_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_to ON direct_messages(to_user_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages(to_user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_direct_messages_pair ON direct_messages(from_user_id, to_user_id, created_at ASC);

-- Game Rooms indexes
CREATE INDEX IF NOT EXISTS idx_game_rooms_host ON game_rooms(host_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_rooms_guest ON game_rooms(guest_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_rooms_active ON game_rooms(status, created_at DESC) WHERE status IN ('waiting', 'playing');

-- Partner Progression indexes
CREATE INDEX IF NOT EXISTS idx_partner_progression_pair ON partner_progression(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_partner_progression_updated ON partner_progression(updated_at DESC);

-- ============================================
-- 2. ADD MISSING COLUMNS
-- ============================================

-- Ensure XP and Level columns exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='xp') THEN
        ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='level') THEN
        ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;
    END IF;
END $$;

-- Update existing NULL values
UPDATE users SET xp = 0 WHERE xp IS NULL;
UPDATE users SET level = 1 WHERE level IS NULL;

-- ============================================
-- 3. OPTIMIZE RLS POLICIES
-- ============================================

-- Optimize gifts RLS policies
DROP POLICY IF EXISTS "Users can view their own gifts and partner gifts" ON gifts;
CREATE POLICY "Users can view their own gifts and partner gifts" ON gifts
    FOR SELECT
    USING (
        auth.uid()::text = from_user_id::text 
        OR auth.uid()::text = to_user_id::text
        OR auth.uid()::text IN (
            SELECT partner_id::text FROM users WHERE id::text = from_user_id::text
            UNION
            SELECT partner_id::text FROM users WHERE id::text = to_user_id::text
        )
    );

-- Optimize direct_messages RLS policies
DROP POLICY IF EXISTS "Users can view their messages" ON direct_messages;
CREATE POLICY "Users can view their messages" ON direct_messages
    FOR SELECT
    USING (auth.uid()::text = from_user_id::text OR auth.uid()::text = to_user_id::text);

-- ============================================
-- 4. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get partner interactions efficiently
CREATE OR REPLACE FUNCTION get_partner_interactions(
    p_user_id TEXT,
    p_partner_id TEXT,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    from_user_id TEXT,
    to_user_id TEXT,
    gift_type TEXT,
    message_text TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.from_user_id,
        g.to_user_id,
        g.gift_type,
        g.message_text,
        g.created_at
    FROM gifts g
    WHERE (g.from_user_id = p_user_id AND g.to_user_id = p_partner_id)
       OR (g.from_user_id = p_partner_id AND g.to_user_id = p_user_id)
    ORDER BY g.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM direct_messages
    WHERE to_user_id = p_user_id AND is_read = false;
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- ============================================
-- DONE! ✅
-- ============================================
-- All optimizations applied successfully
-- Your app should be faster now!
-- 
-- Optional: Run VACUUM manually later:
-- VACUUM ANALYZE users;
-- VACUUM ANALYZE gifts;
-- VACUUM ANALYZE direct_messages;
-- ============================================
