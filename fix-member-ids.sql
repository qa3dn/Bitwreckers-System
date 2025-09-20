-- Fix Member ID generation and validation
-- First, let's update the generate_member_id function to be more robust

DROP FUNCTION IF EXISTS generate_member_id(text);

CREATE OR REPLACE FUNCTION generate_member_id(department_code text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    next_number integer;
    new_member_id text;
BEGIN
    -- Get the next available number for this department
    SELECT COALESCE(MAX(CAST(SUBSTRING(member_id FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM users
    WHERE member_id LIKE department_code || '-%'
    AND LENGTH(member_id) = LENGTH(department_code) + 5; -- e.g., "PR-1234" = 7 chars
    
    -- Format the member ID with leading zeros
    new_member_id := department_code || '-' || LPAD(next_number::text, 4, '0');
    
    RETURN new_member_id;
END;
$$;

-- Update existing users with proper member IDs based on their department
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
WHERE member_id IS NULL OR member_id = '' OR member_id LIKE 'GEN-%';

-- Add unique constraint to member_id
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_member_id_key;
ALTER TABLE users ADD CONSTRAINT users_member_id_key UNIQUE (member_id);

-- Update the check_member_id function
CREATE OR REPLACE FUNCTION check_member_id(member_id text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if member_id follows the pattern: XX-####
    RETURN member_id ~ '^[A-Z]{2}-[0-9]{4}$';
END;
$$;

-- Add check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_member_id_check;
ALTER TABLE users ADD CONSTRAINT users_member_id_check CHECK (check_member_id(member_id));
