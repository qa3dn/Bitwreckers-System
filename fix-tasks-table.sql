-- Fix tasks table structure and permissions
-- This script ensures the tasks table exists with proper structure

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'todo',
  due_date DATE,
  task_type VARCHAR(50) DEFAULT 'project',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50),
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;

-- Create trigger for tasks
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tasks
DROP POLICY IF EXISTS "Allow all for authenticated users" ON tasks;
CREATE POLICY "Allow all for authenticated users" ON tasks
    FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for notifications
DROP POLICY IF EXISTS "Allow all for authenticated users" ON notifications;
CREATE POLICY "Allow all for authenticated users" ON notifications
    FOR ALL USING (auth.role() = 'authenticated');

-- Add tables to Realtime publication
DO $$
BEGIN
    -- Add tasks to realtime
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tasks') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
    END IF;
    
    -- Add notifications to realtime
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
END $$;

-- Show table status
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('tasks', 'notifications') 
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'notifications')
ORDER BY table_name;

-- Test insert a sample task
INSERT INTO tasks (title, description, priority, status, task_type, created_by, assigned_to)
VALUES (
  'Test Task',
  'This is a test task to verify the table works',
  'medium',
  'todo',
  'project',
  (SELECT id FROM users LIMIT 1),
  (SELECT id FROM users LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Show sample tasks
SELECT id, title, status, priority, created_at FROM tasks ORDER BY created_at DESC LIMIT 5;
