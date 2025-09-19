-- Fix users table structure
-- Add missing columns if they don't exist

-- Add member_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_id TEXT;

-- Add department column  
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;

-- Update role constraint to include all valid roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role;
ALTER TABLE users ADD CONSTRAINT check_role 
CHECK (role IN ('team-lead', 'project-manager', 'member'));

-- Update department constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_department;
ALTER TABLE users ADD CONSTRAINT check_department 
CHECK (department IN ('PR', 'Media', 'Dev', 'Management', 'General'));

-- Update existing users to have valid values
UPDATE users 
SET department = 'General' 
WHERE department IS NULL;

UPDATE users 
SET role = 'member' 
WHERE role IS NULL OR role = '';

-- Create member_ids table if it doesn't exist
CREATE TABLE IF NOT EXISTS member_ids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL,
  assigned BOOLEAN DEFAULT FALSE,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on member_ids
ALTER TABLE member_ids ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for member_ids
DROP POLICY IF EXISTS "Team leads can view all member IDs" ON member_ids;
DROP POLICY IF EXISTS "Team leads can manage member IDs" ON member_ids;
DROP POLICY IF EXISTS "Users can view their own member ID" ON member_ids;

CREATE POLICY "Team leads can view all member IDs"
ON member_ids FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'team-lead'
  )
);

CREATE POLICY "Team leads can manage member IDs"
ON member_ids FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'team-lead'
  )
);

CREATE POLICY "Users can view their own member ID"
ON member_ids FOR SELECT TO authenticated
USING (assigned_to = auth.uid());

-- Create function to generate member ID
CREATE OR REPLACE FUNCTION generate_member_id(department_code TEXT)
RETURNS TEXT AS $$
DECLARE
  random_num INTEGER;
  member_id TEXT;
BEGIN
  -- Generate 4 random digits
  random_num := floor(random() * 9000) + 1000;
  member_id := department_code || '-' || random_num::TEXT;
  
  -- Check if ID already exists, regenerate if needed
  WHILE EXISTS (SELECT 1 FROM member_ids WHERE member_id = member_id) LOOP
    random_num := floor(random() * 9000) + 1000;
    member_id := department_code || '-' || random_num::TEXT;
  END LOOP;
  
  RETURN member_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to extract role from member ID
CREATE OR REPLACE FUNCTION extract_role_from_member_id(member_id TEXT)
RETURNS TABLE(department TEXT, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN member_id LIKE 'PR-%' THEN 'PR'
      WHEN member_id LIKE 'MED-%' THEN 'Media'
      WHEN member_id LIKE 'DEV-%' THEN 'Dev'
      WHEN member_id LIKE 'MGT-%' THEN 'Management'
      WHEN member_id LIKE 'GEN-%' THEN 'General'
      ELSE 'General'
    END as department,
    CASE 
      WHEN member_id LIKE 'PR-%' THEN 'member'
      WHEN member_id LIKE 'MED-%' THEN 'member'
      WHEN member_id LIKE 'DEV-%' THEN 'member'
      WHEN member_id LIKE 'MGT-%' THEN 'member'
      WHEN member_id LIKE 'GEN-%' THEN 'member'
      ELSE 'member'
    END as role;
END;
$$ LANGUAGE plpgsql;
