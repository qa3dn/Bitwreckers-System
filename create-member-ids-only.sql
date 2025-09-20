-- Create Member IDs without creating user records
-- This approach creates a separate member_ids table for management

-- Create member_ids table if it doesn't exist
CREATE TABLE IF NOT EXISTS member_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id VARCHAR(10) UNIQUE NOT NULL,
  department VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL,
  assigned BOOLEAN DEFAULT FALSE,
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_member_ids_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_member_ids_updated_at ON member_ids;
CREATE TRIGGER update_member_ids_updated_at
    BEFORE UPDATE ON member_ids
    FOR EACH ROW
    EXECUTE FUNCTION update_member_ids_updated_at();

-- Generate sample member IDs for each department
INSERT INTO member_ids (member_id, department, role) VALUES
-- Programming department
('PR-0001', 'programming', 'member'),
('PR-0002', 'programming', 'member'),
('PR-0003', 'programming', 'member'),
('PR-0004', 'programming', 'member'),
('PR-0005', 'programming', 'member'),

-- Design department
('DS-0001', 'design', 'member'),
('DS-0002', 'design', 'member'),
('DS-0003', 'design', 'member'),
('DS-0004', 'design', 'member'),
('DS-0005', 'design', 'member'),

-- Marketing department
('MK-0001', 'marketing', 'member'),
('MK-0002', 'marketing', 'member'),
('MK-0003', 'marketing', 'member'),
('MK-0004', 'marketing', 'member'),
('MK-0005', 'marketing', 'member'),

-- Management department
('MG-0001', 'management', 'team_leader'),
('MG-0002', 'management', 'team_leader'),
('MG-0003', 'management', 'team_leader'),

-- General department
('GN-0001', 'general', 'member'),
('GN-0002', 'general', 'member'),
('GN-0003', 'general', 'member'),
('GN-0004', 'general', 'member'),
('GN-0005', 'general', 'member')
ON CONFLICT (member_id) DO NOTHING;

-- Show created member IDs
SELECT 
  id,
  member_id,
  department,
  role,
  assigned,
  assigned_to,
  created_at
FROM member_ids 
ORDER BY department, member_id;

-- Show statistics
SELECT 
  department,
  COUNT(*) as total_ids,
  COUNT(CASE WHEN assigned = TRUE THEN 1 END) as assigned_ids,
  COUNT(CASE WHEN assigned = FALSE THEN 1 END) as available_ids
FROM member_ids 
GROUP BY department
ORDER BY department;
