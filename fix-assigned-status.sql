-- Fix Member ID assignment status for existing users
-- First, let's ensure all users have proper member IDs

-- Update users without member IDs or with invalid format
UPDATE users 
SET member_id = generate_member_id(
  CASE 
    WHEN department = 'programming' THEN 'PR'
    WHEN department = 'design' THEN 'DS'
    WHEN department = 'marketing' THEN 'MK'
    WHEN department = 'management' THEN 'MG'
    WHEN department = 'general' THEN 'GN'
    ELSE 'GN'
  END
)
WHERE member_id IS NULL 
   OR member_id = '' 
   OR member_id NOT LIKE '%-%'
   OR member_id !~ '^[A-Z]{2,3}-[0-9]{4}$';

-- Fix users with old format member IDs
UPDATE users 
SET member_id = generate_member_id(
  CASE 
    WHEN department = 'programming' THEN 'PR'
    WHEN department = 'design' THEN 'DS'
    WHEN department = 'marketing' THEN 'MK'
    WHEN department = 'management' THEN 'MG'
    WHEN department = 'general' THEN 'GN'
    ELSE 'GN'
  END
)
WHERE member_id LIKE 'GEN-%' 
   OR member_id LIKE 'MED-%' 
   OR member_id LIKE 'DEV-%' 
   OR member_id LIKE 'MGT-%';

-- Ensure all users have valid member IDs
UPDATE users 
SET member_id = generate_member_id('GN')
WHERE member_id IS NULL OR member_id = '';

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
