-- ============================================
-- PERFORMANCE OPTIMIZATION FOR NORONA APP
-- ============================================
-- This script optimizes database performance
-- Focus: Partner Page & Real-time Features
-- ============================================

-- ============================================
-- 1. CREATE MISSING INDEXES
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
-- 2. ADD MISSING COLUMNS FIRST
-- ============================================

-- Ensure XP and Level columns exist BEFORE creating materialized view
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
-- 3. OPTIMIZE QUERIES WITH MATERIALIZED VIEWS
-- ============================================

-- Create materialized view for partner stats (reduces load)
DROP MATERIALIZED VIEW IF EXISTS partner_stats_summary CASCADE;
CREATE MATERIALIZED VIEW partner_stats_summary AS
SELECT 
    u.id as user_id,
    u.partner_id,
    u.streak_count,
    u.last_login,
    u.avatar_url,
    u.username,
    COALESCE(u.xp, 0) as xp,
    COALESCE(u.level, 1) as level,
    COUNT(DISTINCT g.id) FILTER (WHERE g.from_user_id::text = u.id::text) as gifts_sent,
    COUNT(DISTINCT g.id) FILTER (WHERE g.to_user_id::text = u.id::text) as gifts_received
FROM users u
LEFT JOIN gifts g ON (g.from_user_id::text = u.id::text OR g.to_user_id::text = u.id::text)
WHERE u.partner_id IS NOT NULL
GROUP BY u.id, u.partner_id, u.streak_count, u.last_login, u.avatar_url, u.username, u.xp, u.level;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_partner_stats_user ON partner_stats_summary(user_id);
CREATE INDEX idx_partner_stats_partner ON partner_stats_summary(partner_id);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_partner_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY partner_stats_summary;
END;
$$;

-- Auto-refresh every 5 minutes using pg_cron (if available)
-- If pg_cron is not available, you can call this manually or via a cron job
-- SELECT cron.schedule('refresh-partner-stats', '*/5 * * * *', 'SELECT refresh_partner_stats()');

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
-- 4. OPTIMIZE RLS POLICIES
-- ============================================

-- ============================================
-- 5. VACUUM AND ANALYZE
-- ============================================

-- Vacuum and analyze all tables for better query planning
VACUUM ANALYZE users;
VACUUM ANALYZE gifts;
VACUUM ANALYZE direct_messages;
VACUUM ANALYZE game_rooms;
VACUUM ANALYZE partner_progression;

-- ============================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get partner interactions efficiently
CREATE OR REPLACE FUNCTION get_partner_interactions(
    p_user_id UUID,
    p_partner_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    from_user_id UUID,
    to_user_id UUID,
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
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
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
-- 7. ENABLE QUERY STATISTICS
-- ============================================

-- Enable pg_stat_statements for query monitoring (if not already enabled)
-- This helps identify slow queries
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================
-- 8. CLEANUP OLD DATA (Optional)
-- ============================================

-- Archive old finished game rooms (older than 7 days)
-- Uncomment if you want to enable this
-- DELETE FROM game_rooms WHERE status = 'finished' AND updated_at < NOW() - INTERVAL '7 days';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- NOTES
-- ============================================
-- 1. Run this script in your Supabase SQL Editor
-- 2. The materialized view should be refreshed periodically
-- 3. Monitor query performance using pg_stat_statements
-- 4. Adjust index strategies based on actual usage patterns
-- ============================================
