-- Check current status of all users and their member IDs
SELECT 
  id,
  email,
  name,
  member_id,
  department,
  role,
  created_at,
  CASE 
    WHEN member_id IS NOT NULL AND member_id != '' THEN 'Has Member ID'
    ELSE 'No Member ID'
  END as member_id_status
FROM users 
ORDER BY created_at DESC
LIMIT 20;

-- Check if there are any users without proper member IDs
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN member_id IS NULL OR member_id = '' THEN 1 END) as users_without_member_id,
  COUNT(CASE WHEN member_id IS NOT NULL AND member_id != '' THEN 1 END) as users_with_member_id
FROM users;

-- Check for users with invalid member ID format
SELECT 
  id,
  email,
  member_id,
  CASE 
    WHEN member_id ~ '^[A-Z]{2,3}-[0-9]{4}$' THEN 'Valid Format'
    ELSE 'Invalid Format'
  END as format_status
FROM users 
WHERE member_id IS NOT NULL AND member_id != '';
