-- Fix function parameter name conflict
-- Drop the existing function first
DROP FUNCTION IF EXISTS generate_member_id(TEXT);

-- Create the function with correct parameter name
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
