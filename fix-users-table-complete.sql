-- Complete fix for users table - add updated_at column and restore member IDs
-- This script handles everything step by step

-- Step 1: Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to users table';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Step 2: Update existing records to have updated_at = created_at
UPDATE users 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Step 3: Create trigger for automatic updated_at updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Check current status of member IDs
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN member_id IS NULL OR member_id = '' THEN 1 END) as users_without_member_id,
  COUNT(CASE WHEN member_id IS NOT NULL AND member_id != '' THEN 1 END) as users_with_member_id
FROM users;

-- Step 5: Show users without member IDs
SELECT 
  id,
  name,
  email,
  department,
  role,
  created_at
FROM users 
WHERE member_id IS NULL OR member_id = ''
ORDER BY created_at;

-- Step 6: Assign member IDs to users without them
WITH user_updates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num,
    department
  FROM users 
  WHERE member_id IS NULL OR member_id = ''
)
UPDATE users 
SET member_id = CASE 
  WHEN u.department = 'programming' THEN 'PR-' || LPAD(u.row_num::text, 4, '0')
  WHEN u.department = 'design' THEN 'DS-' || LPAD(u.row_num::text, 4, '0')
  WHEN u.department = 'marketing' THEN 'MK-' || LPAD(u.row_num::text, 4, '0')
  WHEN u.department = 'management' THEN 'MG-' || LPAD(u.row_num::text, 4, '0')
  ELSE 'GN-' || LPAD(u.row_num::text, 4, '0')
END
FROM user_updates u
WHERE users.id = u.id;

-- Step 7: Show final results
SELECT 
  id,
  name,
  email,
  member_id,
  department,
  role,
  created_at,
  updated_at,
  'ASSIGNED' as status
FROM users 
WHERE member_id IS NOT NULL AND member_id != ''
ORDER BY created_at DESC;

-- Step 8: Verify no users are left without member IDs
SELECT 
  COUNT(*) as remaining_users_without_member_id
FROM users 
WHERE member_id IS NULL OR member_id = '';

-- Step 9: Show table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
