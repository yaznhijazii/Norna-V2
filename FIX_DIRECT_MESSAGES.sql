-- ✅ Fix direct_messages table (already exists, just add missing parts)

-- Enable RLS if not enabled
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Drop old policies if exist
DROP POLICY IF EXISTS "Users can read their messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can update their sent messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can read their own messages" ON direct_messages;

-- Create fresh policies
CREATE POLICY "Users can read their messages"
ON direct_messages FOR SELECT
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can send messages"
ON direct_messages FOR INSERT
WITH CHECK (from_user_id = auth.uid());

-- Enable Realtime (already enabled, skip this line if error)
-- ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- Test query
SELECT COUNT(*) as total_messages FROM direct_messages;
