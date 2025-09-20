-- Simple fix for Member ID assignment without using generate_member_id function
-- This will assign proper member IDs to existing users

-- First, let's see what we have
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

-- Update users without member IDs
UPDATE users 
SET member_id = 'GN-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0')
WHERE member_id IS NULL OR member_id = '';

-- Update users with invalid member IDs
UPDATE users 
SET member_id = 'GN-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0')
WHERE member_id NOT LIKE '%-%' 
   OR member_id !~ '^[A-Z]{2,3}-[0-9]{4}$';

-- Update users with old format member IDs
UPDATE users 
SET member_id = 'GN-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0')
WHERE member_id LIKE 'GEN-%' 
   OR member_id LIKE 'MED-%' 
   OR member_id LIKE 'DEV-%' 
   OR member_id LIKE 'MGT-%';

-- Show the results
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
