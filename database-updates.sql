-- Bit Management Database Updates - Roles & Permissions System
-- Run this in your Supabase SQL editor to update the database

-- Update users table to include team-lead role
ALTER TABLE users 
ADD CONSTRAINT check_role CHECK (role IN ('team-lead', 'project-manager', 'member'));

-- Update existing users to have proper roles (optional)
-- UPDATE users SET role = 'member' WHERE role = 'admin';

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('project-manager', 'member')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Update projects table to include created_by
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Update tasks table to include assigned_to and created_by
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- RLS Policies for project_members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see project members for projects they're part of
CREATE POLICY "Users can view project members for their projects" ON project_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Team leads can manage all project members
CREATE POLICY "Team leads can manage project members" ON project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'team-lead'
    )
  );

-- Policy: Project managers can manage members in their projects
CREATE POLICY "Project managers can manage members in their projects" ON project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.user_id = auth.uid() 
      AND pm.role = 'project-manager'
      AND pm.project_id = project_members.project_id
    )
  );

-- Update existing RLS policies for tasks
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
CREATE POLICY "Users can view assigned tasks" ON tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR 
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id 
      AND pm.user_id = auth.uid()
    )
  );

-- Update projects RLS policy
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
CREATE POLICY "Users can view accessible projects" ON projects
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id 
      AND pm.user_id = auth.uid()
    )
  );

-- Function to check if user is team lead
CREATE OR REPLACE FUNCTION is_team_lead(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id AND role = 'team-lead'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is project manager for a project
CREATE OR REPLACE FUNCTION is_project_manager(user_id UUID, project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.user_id = user_id 
    AND pm.project_id = project_id 
    AND pm.role = 'project-manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is member of a project
CREATE OR REPLACE FUNCTION is_project_member(user_id UUID, project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.user_id = user_id 
    AND pm.project_id = project_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create personal_todos table for personal to-do lists
CREATE TABLE IF NOT EXISTS personal_todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  todo_type TEXT DEFAULT 'daily' CHECK (todo_type IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for personal_todos
CREATE INDEX IF NOT EXISTS idx_personal_todos_user_id ON personal_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_todos_status ON personal_todos(status);
CREATE INDEX IF NOT EXISTS idx_personal_todos_todo_type ON personal_todos(todo_type);
CREATE INDEX IF NOT EXISTS idx_personal_todos_due_date ON personal_todos(due_date);

-- RLS Policies for personal_todos
ALTER TABLE personal_todos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own personal todos
CREATE POLICY "Users can view their own personal todos" ON personal_todos
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can insert their own personal todos
CREATE POLICY "Users can insert their own personal todos" ON personal_todos
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own personal todos
CREATE POLICY "Users can update their own personal todos" ON personal_todos
  FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users can delete their own personal todos
CREATE POLICY "Users can delete their own personal todos" ON personal_todos
  FOR DELETE USING (user_id = auth.uid());

-- Update tasks table to distinguish between project tasks and personal tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'project' CHECK (task_type IN ('project', 'personal'));

-- Update tasks RLS policy to handle both project and personal tasks
DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
CREATE POLICY "Users can view accessible tasks" ON tasks
  FOR SELECT USING (
    -- Project tasks: assigned to user or user is project member
    (task_type = 'project' AND (
      assigned_to = auth.uid() OR 
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = tasks.project_id 
        AND pm.user_id = auth.uid()
      )
    )) OR
    -- Personal tasks: only assigned to user
    (task_type = 'personal' AND assigned_to = auth.uid())
  );

-- Create messages table for multi-mode chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE, -- null for project chat or company chat
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- null for direct chat or company chat
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image')),
  file_url TEXT, -- for file/image messages
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- RLS Policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages they sent or received
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR 
    receiver_id = auth.uid() OR
    -- Project chat: user is member of the project
    (project_id IS NOT NULL AND receiver_id IS NULL AND EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = messages.project_id 
      AND pm.user_id = auth.uid()
    )) OR
    -- Company chat: all users can see
    (project_id IS NULL AND receiver_id IS NULL)
  );

-- Temporary policy for testing - allow all authenticated users to see all messages
CREATE POLICY "Temporary: All users can see all messages" ON messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy: Users can insert messages
CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
  );

-- Policy: Users can update their own messages
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (sender_id = auth.uid());

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Create member_ids table for membership management
CREATE TABLE IF NOT EXISTS member_ids (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id text UNIQUE NOT NULL,
  department text NOT NULL CHECK (department IN ('pr', 'media', 'dev', 'management', 'general')),
  role text NOT NULL CHECK (role IN ('pr_member', 'media_member', 'dev_member', 'management_member', 'general_member')),
  assigned boolean DEFAULT false,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_member_ids_member_id ON member_ids(member_id);
CREATE INDEX IF NOT EXISTS idx_member_ids_assigned ON member_ids(assigned);
CREATE INDEX IF NOT EXISTS idx_member_ids_department ON member_ids(department);

-- Add department and member_id columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_id text;

-- Create function to generate member ID
CREATE OR REPLACE FUNCTION generate_member_id(department_name text)
RETURNS text AS $$
DECLARE
  prefix text;
  year_part text;
  sequence_num text;
  new_member_id text;
  max_sequence int;
BEGIN
  -- Set prefix based on department
  CASE department_name
    WHEN 'pr' THEN prefix := 'PR';
    WHEN 'media' THEN prefix := 'MEDIA';
    WHEN 'dev' THEN prefix := 'DEV';
    WHEN 'management' THEN prefix := 'MNG';
    ELSE prefix := 'GEN';
  END CASE;
  
  -- Get current year
  year_part := EXTRACT(year FROM now())::text;
  
  -- Get next sequence number for this department and year
  SELECT COALESCE(MAX(CAST(SUBSTRING(member_id FROM LENGTH(prefix) + 2 + LENGTH(year_part) + 1) AS int)), 0) + 1
  INTO max_sequence
  FROM member_ids
  WHERE member_id LIKE prefix || '-' || year_part || '-%';
  
  -- Format sequence number with leading zeros (3 digits)
  sequence_num := LPAD(max_sequence::text, 3, '0');
  
  -- Combine to create member ID
  new_member_id := prefix || '-' || year_part || '-' || sequence_num;
  
  RETURN new_member_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to extract role from member ID
CREATE OR REPLACE FUNCTION extract_role_from_member_id(member_id text)
RETURNS TABLE(department text, role text) AS $$
BEGIN
  IF member_id LIKE 'PR-%' THEN
    RETURN QUERY SELECT 'pr'::text, 'pr_member'::text;
  ELSIF member_id LIKE 'MEDIA-%' THEN
    RETURN QUERY SELECT 'media'::text, 'media_member'::text;
  ELSIF member_id LIKE 'DEV-%' THEN
    RETURN QUERY SELECT 'dev'::text, 'dev_member'::text;
  ELSIF member_id LIKE 'MNG-%' THEN
    RETURN QUERY SELECT 'management'::text, 'management_member'::text;
  ELSE
    RETURN QUERY SELECT 'general'::text, 'general_member'::text;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Disable RLS on member_ids table for now
ALTER TABLE member_ids DISABLE ROW LEVEL SECURITY;

-- Create profiles table for user profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name text,
  bio text,
  department text,
  specialization text,
  study_field text,
  team text,
  projects_count integer DEFAULT 0,
  social_links jsonb DEFAULT '{}',
  avatar_url text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_team ON profiles(team);
CREATE INDEX IF NOT EXISTS idx_profiles_specialization ON profiles(specialization);

-- Create function to update projects_count
CREATE OR REPLACE FUNCTION update_user_projects_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update projects count for the user
  UPDATE profiles 
  SET projects_count = (
    SELECT COUNT(*) 
    FROM project_members 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update projects_count
DROP TRIGGER IF EXISTS trigger_update_projects_count ON project_members;
CREATE TRIGGER trigger_update_projects_count
  AFTER INSERT OR UPDATE OR DELETE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_user_projects_count();

-- Disable RLS on profiles table for now
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Task Dependencies Table
CREATE TABLE IF NOT EXISTS task_dependencies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES users(id),
    UNIQUE(task_id, depends_on_task_id),
    CHECK(task_id != depends_on_task_id) -- Prevent self-dependency
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- RLS Policies for task_dependencies
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view dependencies for tasks they have access to
CREATE POLICY "Users can view task dependencies" ON task_dependencies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_dependencies.task_id 
            AND (
                t.assigned_to = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM project_members pm 
                    WHERE pm.project_id = t.project_id 
                    AND pm.user_id = auth.uid()
                )
            )
        )
    );

-- Policy: Users can create dependencies for tasks they can edit
CREATE POLICY "Users can create task dependencies" ON task_dependencies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_dependencies.task_id 
            AND (
                t.assigned_to = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM project_members pm 
                    WHERE pm.project_id = t.project_id 
                    AND pm.user_id = auth.uid()
                    AND pm.role IN ('manager', 'team-lead')
                )
            )
        )
    );

-- Policy: Users can delete dependencies for tasks they can edit
CREATE POLICY "Users can delete task dependencies" ON task_dependencies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.id = task_dependencies.task_id 
            AND (
                t.assigned_to = auth.uid() 
                OR EXISTS (
                    SELECT 1 FROM project_members pm 
                    WHERE pm.project_id = t.project_id 
                    AND pm.user_id = auth.uid()
                    AND pm.role IN ('manager', 'team-lead')
                )
            )
        )
    );

-- Function to check if task can be started (no incomplete dependencies)
CREATE OR REPLACE FUNCTION can_task_start(task_uuid uuid)
RETURNS boolean AS $$
DECLARE
    incomplete_deps integer;
BEGIN
    SELECT COUNT(*)
    INTO incomplete_deps
    FROM task_dependencies td
    JOIN tasks t ON t.id = td.depends_on_task_id
    WHERE td.task_id = task_uuid
    AND t.status NOT IN ('done', 'completed');
    
    RETURN incomplete_deps = 0;
END;
$$ LANGUAGE plpgsql;

-- Add foreign key constraints with specific names for better relationship handling
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_project_id_fkey;

ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT messages_receiver_id_fkey 
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT messages_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Create member_ids table for membership management
CREATE TABLE IF NOT EXISTS member_ids (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id text UNIQUE NOT NULL,
  department text NOT NULL CHECK (department IN ('pr', 'media', 'dev', 'management', 'general')),
  role text NOT NULL CHECK (role IN ('pr_member', 'media_member', 'dev_member', 'management_member', 'general_member')),
  assigned boolean DEFAULT false,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_member_ids_member_id ON member_ids(member_id);
CREATE INDEX IF NOT EXISTS idx_member_ids_assigned ON member_ids(assigned);
CREATE INDEX IF NOT EXISTS idx_member_ids_department ON member_ids(department);

-- Add department and member_id columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_id text;

-- Create function to generate member ID
CREATE OR REPLACE FUNCTION generate_member_id(department_name text)
RETURNS text AS $$
DECLARE
  prefix text;
  year_part text;
  sequence_num text;
  new_member_id text;
  max_sequence int;
BEGIN
  -- Set prefix based on department
  CASE department_name
    WHEN 'pr' THEN prefix := 'PR';
    WHEN 'media' THEN prefix := 'MEDIA';
    WHEN 'dev' THEN prefix := 'DEV';
    WHEN 'management' THEN prefix := 'MNG';
    ELSE prefix := 'GEN';
  END CASE;
  
  -- Get current year
  year_part := EXTRACT(year FROM now())::text;
  
  -- Get next sequence number for this department and year
  SELECT COALESCE(MAX(CAST(SUBSTRING(member_id FROM LENGTH(prefix) + 2 + LENGTH(year_part) + 1) AS int)), 0) + 1
  INTO max_sequence
  FROM member_ids
  WHERE member_id LIKE prefix || '-' || year_part || '-%';
  
  -- Format sequence number with leading zeros (3 digits)
  sequence_num := LPAD(max_sequence::text, 3, '0');
  
  -- Combine to create member ID
  new_member_id := prefix || '-' || year_part || '-' || sequence_num;
  
  RETURN new_member_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to extract role from member ID
CREATE OR REPLACE FUNCTION extract_role_from_member_id(member_id text)
RETURNS TABLE(department text, role text) AS $$
BEGIN
  IF member_id LIKE 'PR-%' THEN
    RETURN QUERY SELECT 'pr'::text, 'pr_member'::text;
  ELSIF member_id LIKE 'MEDIA-%' THEN
    RETURN QUERY SELECT 'media'::text, 'media_member'::text;
  ELSIF member_id LIKE 'DEV-%' THEN
    RETURN QUERY SELECT 'dev'::text, 'dev_member'::text;
  ELSIF member_id LIKE 'MNG-%' THEN
    RETURN QUERY SELECT 'management'::text, 'management_member'::text;
  ELSE
    RETURN QUERY SELECT 'general'::text, 'general_member'::text;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Disable RLS on member_ids table for now
ALTER TABLE member_ids DISABLE ROW LEVEL SECURITY;

-- Create profiles table for user profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name text,
  bio text,
  department text,
  specialization text,
  study_field text,
  team text,
  projects_count integer DEFAULT 0,
  social_links jsonb DEFAULT '{}',
  avatar_url text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_team ON profiles(team);
CREATE INDEX IF NOT EXISTS idx_profiles_specialization ON profiles(specialization);

-- Create function to update projects_count
CREATE OR REPLACE FUNCTION update_user_projects_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update projects count for the user
  UPDATE profiles 
  SET projects_count = (
    SELECT COUNT(*) 
    FROM project_members 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update projects_count
DROP TRIGGER IF EXISTS trigger_update_projects_count ON project_members;
CREATE TRIGGER trigger_update_projects_count
  AFTER INSERT OR UPDATE OR DELETE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_user_projects_count();

-- Disable RLS on profiles table for now
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Function to get task dependencies
CREATE OR REPLACE FUNCTION get_task_dependencies(task_uuid uuid)
RETURNS TABLE (
    dependency_id uuid,
    dependency_title text,
    dependency_status text,
    dependency_priority text,
    dependency_due_date timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.status,
        t.priority,
        t.due_date
    FROM task_dependencies td
    JOIN tasks t ON t.id = td.depends_on_task_id
    WHERE td.task_id = task_uuid
    ORDER BY t.priority DESC, t.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Add foreign key constraints with specific names for better relationship handling
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_project_id_fkey;

ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT messages_receiver_id_fkey 
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT messages_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Create member_ids table for membership management
CREATE TABLE IF NOT EXISTS member_ids (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id text UNIQUE NOT NULL,
  department text NOT NULL CHECK (department IN ('pr', 'media', 'dev', 'management', 'general')),
  role text NOT NULL CHECK (role IN ('pr_member', 'media_member', 'dev_member', 'management_member', 'general_member')),
  assigned boolean DEFAULT false,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_member_ids_member_id ON member_ids(member_id);
CREATE INDEX IF NOT EXISTS idx_member_ids_assigned ON member_ids(assigned);
CREATE INDEX IF NOT EXISTS idx_member_ids_department ON member_ids(department);

-- Add department and member_id columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_id text;

-- Create function to generate member ID
CREATE OR REPLACE FUNCTION generate_member_id(department_name text)
RETURNS text AS $$
DECLARE
  prefix text;
  year_part text;
  sequence_num text;
  new_member_id text;
  max_sequence int;
BEGIN
  -- Set prefix based on department
  CASE department_name
    WHEN 'pr' THEN prefix := 'PR';
    WHEN 'media' THEN prefix := 'MEDIA';
    WHEN 'dev' THEN prefix := 'DEV';
    WHEN 'management' THEN prefix := 'MNG';
    ELSE prefix := 'GEN';
  END CASE;
  
  -- Get current year
  year_part := EXTRACT(year FROM now())::text;
  
  -- Get next sequence number for this department and year
  SELECT COALESCE(MAX(CAST(SUBSTRING(member_id FROM LENGTH(prefix) + 2 + LENGTH(year_part) + 1) AS int)), 0) + 1
  INTO max_sequence
  FROM member_ids
  WHERE member_id LIKE prefix || '-' || year_part || '-%';
  
  -- Format sequence number with leading zeros (3 digits)
  sequence_num := LPAD(max_sequence::text, 3, '0');
  
  -- Combine to create member ID
  new_member_id := prefix || '-' || year_part || '-' || sequence_num;
  
  RETURN new_member_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to extract role from member ID
CREATE OR REPLACE FUNCTION extract_role_from_member_id(member_id text)
RETURNS TABLE(department text, role text) AS $$
BEGIN
  IF member_id LIKE 'PR-%' THEN
    RETURN QUERY SELECT 'pr'::text, 'pr_member'::text;
  ELSIF member_id LIKE 'MEDIA-%' THEN
    RETURN QUERY SELECT 'media'::text, 'media_member'::text;
  ELSIF member_id LIKE 'DEV-%' THEN
    RETURN QUERY SELECT 'dev'::text, 'dev_member'::text;
  ELSIF member_id LIKE 'MNG-%' THEN
    RETURN QUERY SELECT 'management'::text, 'management_member'::text;
  ELSE
    RETURN QUERY SELECT 'general'::text, 'general_member'::text;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Disable RLS on member_ids table for now
ALTER TABLE member_ids DISABLE ROW LEVEL SECURITY;

-- Create profiles table for user profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name text,
  bio text,
  department text,
  specialization text,
  study_field text,
  team text,
  projects_count integer DEFAULT 0,
  social_links jsonb DEFAULT '{}',
  avatar_url text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_team ON profiles(team);
CREATE INDEX IF NOT EXISTS idx_profiles_specialization ON profiles(specialization);

-- Create function to update projects_count
CREATE OR REPLACE FUNCTION update_user_projects_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update projects count for the user
  UPDATE profiles 
  SET projects_count = (
    SELECT COUNT(*) 
    FROM project_members 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update projects_count
DROP TRIGGER IF EXISTS trigger_update_projects_count ON project_members;
CREATE TRIGGER trigger_update_projects_count
  AFTER INSERT OR UPDATE OR DELETE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_user_projects_count();

-- Disable RLS on profiles table for now
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Function to get dependent tasks
CREATE OR REPLACE FUNCTION get_dependent_tasks(task_uuid uuid)
RETURNS TABLE (
    dependent_id uuid,
    dependent_title text,
    dependent_status text,
    dependent_priority text,
    dependent_due_date timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.status,
        t.priority,
        t.due_date
    FROM task_dependencies td
    JOIN tasks t ON t.id = td.task_id
    WHERE td.depends_on_task_id = task_uuid
    ORDER BY t.priority DESC, t.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Add foreign key constraints with specific names for better relationship handling
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_project_id_fkey;

ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT messages_receiver_id_fkey 
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT messages_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Create member_ids table for membership management
CREATE TABLE IF NOT EXISTS member_ids (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id text UNIQUE NOT NULL,
  department text NOT NULL CHECK (department IN ('pr', 'media', 'dev', 'management', 'general')),
  role text NOT NULL CHECK (role IN ('pr_member', 'media_member', 'dev_member', 'management_member', 'general_member')),
  assigned boolean DEFAULT false,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_member_ids_member_id ON member_ids(member_id);
CREATE INDEX IF NOT EXISTS idx_member_ids_assigned ON member_ids(assigned);
CREATE INDEX IF NOT EXISTS idx_member_ids_department ON member_ids(department);

-- Add department and member_id columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_id text;

-- Create function to generate member ID
CREATE OR REPLACE FUNCTION generate_member_id(department_name text)
RETURNS text AS $$
DECLARE
  prefix text;
  year_part text;
  sequence_num text;
  new_member_id text;
  max_sequence int;
BEGIN
  -- Set prefix based on department
  CASE department_name
    WHEN 'pr' THEN prefix := 'PR';
    WHEN 'media' THEN prefix := 'MEDIA';
    WHEN 'dev' THEN prefix := 'DEV';
    WHEN 'management' THEN prefix := 'MNG';
    ELSE prefix := 'GEN';
  END CASE;
  
  -- Get current year
  year_part := EXTRACT(year FROM now())::text;
  
  -- Get next sequence number for this department and year
  SELECT COALESCE(MAX(CAST(SUBSTRING(member_id FROM LENGTH(prefix) + 2 + LENGTH(year_part) + 1) AS int)), 0) + 1
  INTO max_sequence
  FROM member_ids
  WHERE member_id LIKE prefix || '-' || year_part || '-%';
  
  -- Format sequence number with leading zeros (3 digits)
  sequence_num := LPAD(max_sequence::text, 3, '0');
  
  -- Combine to create member ID
  new_member_id := prefix || '-' || year_part || '-' || sequence_num;
  
  RETURN new_member_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to extract role from member ID
CREATE OR REPLACE FUNCTION extract_role_from_member_id(member_id text)
RETURNS TABLE(department text, role text) AS $$
BEGIN
  IF member_id LIKE 'PR-%' THEN
    RETURN QUERY SELECT 'pr'::text, 'pr_member'::text;
  ELSIF member_id LIKE 'MEDIA-%' THEN
    RETURN QUERY SELECT 'media'::text, 'media_member'::text;
  ELSIF member_id LIKE 'DEV-%' THEN
    RETURN QUERY SELECT 'dev'::text, 'dev_member'::text;
  ELSIF member_id LIKE 'MNG-%' THEN
    RETURN QUERY SELECT 'management'::text, 'management_member'::text;
  ELSE
    RETURN QUERY SELECT 'general'::text, 'general_member'::text;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Disable RLS on member_ids table for now
ALTER TABLE member_ids DISABLE ROW LEVEL SECURITY;

-- Create profiles table for user profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name text,
  bio text,
  department text,
  specialization text,
  study_field text,
  team text,
  projects_count integer DEFAULT 0,
  social_links jsonb DEFAULT '{}',
  avatar_url text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_team ON profiles(team);
CREATE INDEX IF NOT EXISTS idx_profiles_specialization ON profiles(specialization);

-- Create function to update projects_count
CREATE OR REPLACE FUNCTION update_user_projects_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update projects count for the user
  UPDATE profiles 
  SET projects_count = (
    SELECT COUNT(*) 
    FROM project_members 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update projects_count
DROP TRIGGER IF EXISTS trigger_update_projects_count ON project_members;
CREATE TRIGGER trigger_update_projects_count
  AFTER INSERT OR UPDATE OR DELETE ON project_members
  FOR EACH ROW
  EXECUTE FUNCTION update_user_projects_count();

-- Disable RLS on profiles table for now
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
