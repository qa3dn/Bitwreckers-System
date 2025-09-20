-- Create test member IDs for different departments
-- These will be available for new users to register with

-- Programming department (PR-0001 to PR-0010)
INSERT INTO users (id, name, email, role, department, member_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Test User ' || i,
  'test' || i || '@example.com',
  'member',
  'programming',
  'PR-' || LPAD(i::text, 4, '0'),
  NOW(),
  NOW()
FROM generate_series(1, 10) AS i
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE member_id = 'PR-' || LPAD(i::text, 4, '0')
);

-- Design department (DS-0001 to DS-0010)
INSERT INTO users (id, name, email, role, department, member_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Test Designer ' || i,
  'designer' || i || '@example.com',
  'member',
  'design',
  'DS-' || LPAD(i::text, 4, '0'),
  NOW(),
  NOW()
FROM generate_series(1, 10) AS i
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE member_id = 'DS-' || LPAD(i::text, 4, '0')
);

-- Marketing department (MK-0001 to MK-0010)
INSERT INTO users (id, name, email, role, department, member_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Test Marketer ' || i,
  'marketer' || i || '@example.com',
  'member',
  'marketing',
  'MK-' || LPAD(i::text, 4, '0'),
  NOW(),
  NOW()
FROM generate_series(1, 10) AS i
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE member_id = 'MK-' || LPAD(i::text, 4, '0')
);

-- Management department (MG-0001 to MG-0010)
INSERT INTO users (id, name, email, role, department, member_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Test Manager ' || i,
  'manager' || i || '@example.com',
  'team_leader',
  'management',
  'MG-' || LPAD(i::text, 4, '0'),
  NOW(),
  NOW()
FROM generate_series(1, 10) AS i
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE member_id = 'MG-' || LPAD(i::text, 4, '0')
);

-- General department (GN-0001 to GN-0010)
INSERT INTO users (id, name, email, role, department, member_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Test General ' || i,
  'general' || i || '@example.com',
  'member',
  'general',
  'GN-' || LPAD(i::text, 4, '0'),
  NOW(),
  NOW()
FROM generate_series(1, 10) AS i
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE member_id = 'GN-' || LPAD(i::text, 4, '0')
);

-- Show created member IDs
SELECT 
  member_id,
  name,
  email,
  department,
  role,
  'Available' as status
FROM users 
WHERE member_id LIKE 'PR-%' OR member_id LIKE 'DS-%' OR member_id LIKE 'MK-%' OR member_id LIKE 'MG-%' OR member_id LIKE 'GN-%'
ORDER BY member_id;
