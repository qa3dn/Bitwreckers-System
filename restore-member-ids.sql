-- Restore Member IDs for existing users
-- This will assign proper member IDs to users who don't have them

-- First, check current status
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN member_id IS NULL OR member_id = '' THEN 1 END) as users_without_member_id,
  COUNT(CASE WHEN member_id IS NOT NULL AND member_id != '' THEN 1 END) as users_with_member_id
FROM users;

-- Show users without member IDs
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

-- Assign member IDs to users without them
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

-- Show final results
SELECT 
  id,
  name,
  email,
  member_id,
  department,
  role,
  created_at,
  'ASSIGNED' as status
FROM users 
WHERE member_id IS NOT NULL AND member_id != ''
ORDER BY created_at DESC;

-- Check for any remaining users without member IDs
SELECT 
  COUNT(*) as remaining_users_without_member_id
FROM users 
WHERE member_id IS NULL OR member_id = '';
