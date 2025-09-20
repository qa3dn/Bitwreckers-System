-- Check current member IDs in users table
SELECT 
  id,
  email,
  name,
  member_id,
  department,
  role,
  created_at
FROM users 
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any users with invalid member IDs
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN member_id IS NULL OR member_id = '' THEN 1 END) as users_without_member_id,
  COUNT(CASE WHEN member_id LIKE 'GEN-%' THEN 1 END) as users_with_default_member_id,
  COUNT(CASE WHEN member_id NOT LIKE 'GEN-%' AND member_id IS NOT NULL AND member_id != '' THEN 1 END) as users_with_valid_member_id
FROM users;

-- Check for duplicate member IDs
SELECT 
  member_id,
  COUNT(*) as count
FROM users 
WHERE member_id IS NOT NULL AND member_id != ''
GROUP BY member_id
HAVING COUNT(*) > 1;
