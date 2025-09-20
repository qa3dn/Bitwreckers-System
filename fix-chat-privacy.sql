-- Fix chat privacy - remove temporary policy that allows all users to see all messages
-- This script fixes the chat privacy issue where all messages were visible to all users

-- Drop the temporary policy that allows all users to see all messages
DROP POLICY IF EXISTS "Temporary: All users can see all messages" ON messages;

-- Ensure the proper privacy policy is in place
DROP POLICY IF EXISTS "Users can view their messages" ON messages;

-- Create the correct privacy policy
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    -- Direct messages: user is sender or receiver
    (sender_id = auth.uid() OR receiver_id = auth.uid()) OR
    -- Project chat: user is member of the project
    (project_id IS NOT NULL AND receiver_id IS NULL AND EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = messages.project_id 
      AND pm.user_id = auth.uid()
    )) OR
    -- Company chat: all authenticated users can see
    (project_id IS NULL AND receiver_id IS NULL)
  );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'messages' 
ORDER BY policyname;

-- Test the privacy by showing what messages each user can see
-- This query should only show messages the current user should see
SELECT 
  m.id,
  m.content,
  m.message_type,
  m.created_at,
  s.name as sender_name,
  r.name as receiver_name,
  p.name as project_name,
  CASE 
    WHEN m.receiver_id IS NOT NULL THEN 'Direct Message'
    WHEN m.project_id IS NOT NULL THEN 'Project Chat'
    ELSE 'Company Chat'
  END as message_type_description
FROM messages m
LEFT JOIN users s ON m.sender_id = s.id
LEFT JOIN users r ON m.receiver_id = r.id
LEFT JOIN projects p ON m.project_id = p.id
ORDER BY m.created_at DESC
LIMIT 10;
