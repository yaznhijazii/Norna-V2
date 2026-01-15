-- ✅ Enable Realtime for gifts table
ALTER PUBLICATION supabase_realtime ADD TABLE gifts;

-- ✅ Verify RLS policies allow reading
-- Check if you can read gifts sent to you
SELECT * FROM gifts WHERE to_user_id = auth.uid() LIMIT 5;

-- ✅ Check if realtime is enabled
SELECT schemaname, tablename, pubname 
FROM pg_publication_tables 
WHERE tablename = 'gifts';
