-- Simple fix - just add updated_at column and assign member IDs
-- This is the safest approach

-- Step 1: Add updated_at column
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Update existing records
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;

-- Step 3: Assign member IDs to users without them
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

-- Step 4: Show results
SELECT 
  id,
  name,
  email,
  member_id,
  department,
  role,
  created_at,
  updated_at
FROM users 
ORDER BY created_at DESC;
