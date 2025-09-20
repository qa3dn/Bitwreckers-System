-- Fix chat recursion by simplifying RLS policies
-- This script fixes the infinite recursion in project_members table

-- Disable RLS temporarily
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on project_members
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Users can insert project members" ON project_members;
DROP POLICY IF EXISTS "Users can update project members" ON project_members;
DROP POLICY IF EXISTS "Users can delete project members" ON project_members;
DROP POLICY IF EXISTS "Team leads can manage all project members" ON project_members;
DROP POLICY IF EXISTS "Project managers can manage their project members" ON project_members;
DROP POLICY IF EXISTS "project_members_select_policy" ON project_members;
DROP POLICY IF EXISTS "project_members_insert_policy" ON project_members;
DROP POLICY IF EXISTS "project_members_update_policy" ON project_members;
DROP POLICY IF EXISTS "project_members_delete_policy" ON project_members;

-- Re-enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Create very simple, non-recursive policies
CREATE POLICY "project_members_simple_select"
ON project_members FOR SELECT TO authenticated
USING (true);

CREATE POLICY "project_members_simple_insert"
ON project_members FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "project_members_simple_update"
ON project_members FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "project_members_simple_delete"
ON project_members FOR DELETE TO authenticated
USING (true);

-- Also fix messages table policies to prevent chat issues
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Drop all existing message policies
DROP POLICY IF EXISTS "Users can view all messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages" ON messages;
DROP POLICY IF EXISTS "Users can delete messages" ON messages;
DROP POLICY IF EXISTS "msg_select_2024" ON messages;
DROP POLICY IF EXISTS "msg_insert_2024" ON messages;
DROP POLICY IF EXISTS "msg_update_2024" ON messages;
DROP POLICY IF EXISTS "msg_delete_2024" ON messages;

-- Re-enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create simple message policies
CREATE POLICY "messages_simple_select"
ON messages FOR SELECT TO authenticated
USING (true);

CREATE POLICY "messages_simple_insert"
ON messages FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "messages_simple_update"
ON messages FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "messages_simple_delete"
ON messages FOR DELETE TO authenticated
USING (true);
