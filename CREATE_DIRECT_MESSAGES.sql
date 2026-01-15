-- ✅ Create direct_messages table for private chat
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ Create indexes for performance
CREATE INDEX idx_direct_messages_from ON direct_messages(from_user_id);
CREATE INDEX idx_direct_messages_to ON direct_messages(to_user_id);
CREATE INDEX idx_direct_messages_created ON direct_messages(created_at DESC);

-- ✅ Enable RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- ✅ RLS Policies
CREATE POLICY "Users can read their own messages"
ON direct_messages FOR SELECT
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can send messages"
ON direct_messages FOR INSERT
WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update their sent messages"
ON direct_messages FOR UPDATE
USING (from_user_id = auth.uid());

-- ✅ Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- ✅ Test query
SELECT 
  dm.*,
  sender.name as sender_name,
  receiver.name as receiver_name
FROM direct_messages dm
LEFT JOIN users sender ON dm.from_user_id = sender.id
LEFT JOIN users receiver ON dm.to_user_id = receiver.id
ORDER BY dm.created_at DESC
LIMIT 10;
