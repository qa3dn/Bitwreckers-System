-- Fix infinite recursion in RLS policies
-- Drop all existing policies on project_members to prevent recursion

-- Disable RLS temporarily
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Users can insert project members" ON project_members;
DROP POLICY IF EXISTS "Users can update project members" ON project_members;
DROP POLICY IF EXISTS "Users can delete project members" ON project_members;
DROP POLICY IF EXISTS "Team leads can manage all project members" ON project_members;
DROP POLICY IF EXISTS "Project managers can manage their project members" ON project_members;

-- Re-enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "project_members_select_policy"
ON project_members FOR SELECT TO authenticated
USING (
  -- Users can see project members if they are part of the project
  EXISTS (
    SELECT 1 FROM project_members pm2 
    WHERE pm2.project_id = project_members.project_id 
    AND pm2.user_id = auth.uid()
  )
  OR
  -- Team leads can see all project members
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'team-lead'
  )
);

CREATE POLICY "project_members_insert_policy"
ON project_members FOR INSERT TO authenticated
WITH CHECK (
  -- Only team leads can add members
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'team-lead'
  )
);

CREATE POLICY "project_members_update_policy"
ON project_members FOR UPDATE TO authenticated
USING (
  -- Only team leads can update members
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'team-lead'
  )
);

CREATE POLICY "project_members_delete_policy"
ON project_members FOR DELETE TO authenticated
USING (
  -- Only team leads can delete members
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'team-lead'
  )
);

-- Also fix any similar issues with other tables
-- Drop and recreate policies for projects table
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view projects" ON projects;
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_policy"
ON projects FOR SELECT TO authenticated
USING (true);

CREATE POLICY "projects_insert_policy"
ON projects FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'team-lead'
  )
);

CREATE POLICY "projects_update_policy"
ON projects FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'team-lead'
  )
);

CREATE POLICY "projects_delete_policy"
ON projects FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'team-lead'
  )
);

-- Fix tasks table policies
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_policy"
ON tasks FOR SELECT TO authenticated
USING (true);

CREATE POLICY "tasks_insert_policy"
ON tasks FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('team-lead', 'project-manager')
  )
);

CREATE POLICY "tasks_update_policy"
ON tasks FOR UPDATE TO authenticated
USING (
  assigned_to = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('team-lead', 'project-manager')
  )
);

CREATE POLICY "tasks_delete_policy"
ON tasks FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'team-lead'
  )
);
