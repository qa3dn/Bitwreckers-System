-- Final fix for Member ID assignment
-- This will properly assign member IDs to existing users

-- Step 1: Check current status
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN member_id IS NULL OR member_id = '' THEN 1 END) as users_without_member_id,
  COUNT(CASE WHEN member_id IS NOT NULL AND member_id != '' THEN 1 END) as users_with_member_id
FROM users;

-- Step 2: Assign member IDs to users without them
WITH user_updates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM users 
  WHERE member_id IS NULL OR member_id = ''
)
UPDATE users 
SET member_id = 'GN-' || LPAD(u.row_num::text, 4, '0')
FROM user_updates u
WHERE users.id = u.id;

-- Step 3: Fix users with invalid member IDs
WITH user_updates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM users 
  WHERE member_id NOT LIKE '%-%' 
     OR member_id !~ '^[A-Z]{2,3}-[0-9]{4}$'
)
UPDATE users 
SET member_id = 'GN-' || LPAD(u.row_num::text, 4, '0')
FROM user_updates u
WHERE users.id = u.id;

-- Step 4: Fix users with old format member IDs
WITH user_updates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM users 
  WHERE member_id LIKE 'GEN-%' 
     OR member_id LIKE 'MED-%' 
     OR member_id LIKE 'DEV-%' 
     OR member_id LIKE 'MGT-%'
)
UPDATE users 
SET member_id = 'GN-' || LPAD(u.row_num::text, 4, '0')
FROM user_updates u
WHERE users.id = u.id;

-- Step 5: Show final results
SELECT 
  id,
  email,
  name,
  member_id,
  department,
  role,
  created_at,
  'ASSIGNED' as status
FROM users 
WHERE member_id IS NOT NULL AND member_id != ''
ORDER BY created_at DESC;

-- Step 6: Check for duplicates
SELECT 
  member_id,
  COUNT(*) as count
FROM users 
WHERE member_id IS NOT NULL AND member_id != ''
GROUP BY member_id
HAVING COUNT(*) > 1;
