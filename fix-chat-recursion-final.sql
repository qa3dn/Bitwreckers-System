-- Fix chat recursion by completely disabling and recreating RLS policies
-- This is the final solution to fix the infinite recursion issue

-- Step 1: Disable RLS on all related tables
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on these tables
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
DROP POLICY IF EXISTS "project_members_simple_select" ON project_members;
DROP POLICY IF EXISTS "project_members_simple_insert" ON project_members;
DROP POLICY IF EXISTS "project_members_simple_update" ON project_members;
DROP POLICY IF EXISTS "project_members_simple_delete" ON project_members;

DROP POLICY IF EXISTS "Users can view all messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages" ON messages;
DROP POLICY IF EXISTS "Users can delete messages" ON messages;
DROP POLICY IF EXISTS "msg_select_2024" ON messages;
DROP POLICY IF EXISTS "msg_insert_2024" ON messages;
DROP POLICY IF EXISTS "msg_update_2024" ON messages;
DROP POLICY IF EXISTS "msg_delete_2024" ON messages;
DROP POLICY IF EXISTS "messages_simple_select" ON messages;
DROP POLICY IF EXISTS "messages_simple_insert" ON messages;
DROP POLICY IF EXISTS "messages_simple_update" ON messages;
DROP POLICY IF EXISTS "messages_simple_delete" ON messages;

DROP POLICY IF EXISTS "Users can view projects" ON projects;
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;
DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;

DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;

-- Step 3: Re-enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Step 4: Create very simple, non-recursive policies
-- Project Members - Allow all authenticated users to do everything
DROP POLICY IF EXISTS "project_members_allow_all" ON project_members;
CREATE POLICY "project_members_allow_all"
ON project_members FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Messages - Allow all authenticated users to do everything
DROP POLICY IF EXISTS "messages_allow_all" ON messages;
CREATE POLICY "messages_allow_all"
ON messages FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Projects - Allow all authenticated users to do everything
DROP POLICY IF EXISTS "projects_allow_all" ON projects;
CREATE POLICY "projects_allow_all"
ON projects FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Tasks - Allow all authenticated users to do everything
DROP POLICY IF EXISTS "tasks_allow_all" ON tasks;
CREATE POLICY "tasks_allow_all"
ON tasks FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Step 5: Ensure Realtime is enabled for messages
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;
END $$;

-- Step 6: Verify the fix
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('project_members', 'messages', 'projects', 'tasks')
ORDER BY tablename, policyname;
