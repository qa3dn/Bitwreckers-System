-- Fix generate_member_id function to resolve ambiguous column reference
DROP FUNCTION IF EXISTS generate_member_id(text);

CREATE OR REPLACE FUNCTION generate_member_id(department_code text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    next_number integer;
    new_member_id text;
    max_attempts integer := 100;
    attempts integer := 0;
BEGIN
    LOOP
        attempts := attempts + 1;
        
        -- Get the next available number for this department
        SELECT COALESCE(MAX(CAST(SUBSTRING(users.member_id FROM 4) AS INTEGER)), 0) + 1
        INTO next_number
        FROM users
        WHERE users.member_id LIKE department_code || '-%'
        AND LENGTH(users.member_id) = LENGTH(department_code) + 5; -- e.g., "PR-1234" = 7 chars
        
        -- Format the member ID with leading zeros
        new_member_id := department_code || '-' || LPAD(next_number::text, 4, '0');
        
        -- Check if this member ID already exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE users.member_id = new_member_id) THEN
            RETURN new_member_id;
        END IF;
        
        -- Prevent infinite loop
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique member ID after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$;

-- Test the function
SELECT generate_member_id('PR') as test_pr_id;
SELECT generate_member_id('DS') as test_ds_id;
SELECT generate_member_id('MK') as test_mk_id;
SELECT generate_member_id('MG') as test_mg_id;
SELECT generate_member_id('GN') as test_gn_id;
