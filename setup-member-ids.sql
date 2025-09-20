-- Setup Member IDs for testing and production
-- This script ensures we have Member IDs available for signup

-- First, create the member_ids table if it doesn't exist
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

-- Generate Member IDs for each department
-- Programming department (20 IDs)
INSERT INTO member_ids (member_id, department, role) VALUES
('PR-0001', 'programming', 'member'),
('PR-0002', 'programming', 'member'),
('PR-0003', 'programming', 'member'),
('PR-0004', 'programming', 'member'),
('PR-0005', 'programming', 'member'),
('PR-0006', 'programming', 'member'),
('PR-0007', 'programming', 'member'),
('PR-0008', 'programming', 'member'),
('PR-0009', 'programming', 'member'),
('PR-0010', 'programming', 'member'),
('PR-0011', 'programming', 'member'),
('PR-0012', 'programming', 'member'),
('PR-0013', 'programming', 'member'),
('PR-0014', 'programming', 'member'),
('PR-0015', 'programming', 'member'),
('PR-0016', 'programming', 'member'),
('PR-0017', 'programming', 'member'),
('PR-0018', 'programming', 'member'),
('PR-0019', 'programming', 'member'),
('PR-0020', 'programming', 'member')
ON CONFLICT (member_id) DO NOTHING;

-- Design department (15 IDs)
INSERT INTO member_ids (member_id, department, role) VALUES
('DS-0001', 'design', 'member'),
('DS-0002', 'design', 'member'),
('DS-0003', 'design', 'member'),
('DS-0004', 'design', 'member'),
('DS-0005', 'design', 'member'),
('DS-0006', 'design', 'member'),
('DS-0007', 'design', 'member'),
('DS-0008', 'design', 'member'),
('DS-0009', 'design', 'member'),
('DS-0010', 'design', 'member'),
('DS-0011', 'design', 'member'),
('DS-0012', 'design', 'member'),
('DS-0013', 'design', 'member'),
('DS-0014', 'design', 'member'),
('DS-0015', 'design', 'member')
ON CONFLICT (member_id) DO NOTHING;

-- Marketing department (15 IDs)
INSERT INTO member_ids (member_id, department, role) VALUES
('MK-0001', 'marketing', 'member'),
('MK-0002', 'marketing', 'member'),
('MK-0003', 'marketing', 'member'),
('MK-0004', 'marketing', 'member'),
('MK-0005', 'marketing', 'member'),
('MK-0006', 'marketing', 'member'),
('MK-0007', 'marketing', 'member'),
('MK-0008', 'marketing', 'member'),
('MK-0009', 'marketing', 'member'),
('MK-0010', 'marketing', 'member'),
('MK-0011', 'marketing', 'member'),
('MK-0012', 'marketing', 'member'),
('MK-0013', 'marketing', 'member'),
('MK-0014', 'marketing', 'member'),
('MK-0015', 'marketing', 'member')
ON CONFLICT (member_id) DO NOTHING;

-- Management department (10 IDs - team leaders)
INSERT INTO member_ids (member_id, department, role) VALUES
('MG-0001', 'management', 'team_leader'),
('MG-0002', 'management', 'team_leader'),
('MG-0003', 'management', 'team_leader'),
('MG-0004', 'management', 'team_leader'),
('MG-0005', 'management', 'team_leader'),
('MG-0006', 'management', 'team_leader'),
('MG-0007', 'management', 'team_leader'),
('MG-0008', 'management', 'team_leader'),
('MG-0009', 'management', 'team_leader'),
('MG-0010', 'management', 'team_leader')
ON CONFLICT (member_id) DO NOTHING;

-- General department (20 IDs)
INSERT INTO member_ids (member_id, department, role) VALUES
('GN-0001', 'general', 'member'),
('GN-0002', 'general', 'member'),
('GN-0003', 'general', 'member'),
('GN-0004', 'general', 'member'),
('GN-0005', 'general', 'member'),
('GN-0006', 'general', 'member'),
('GN-0007', 'general', 'member'),
('GN-0008', 'general', 'member'),
('GN-0009', 'general', 'member'),
('GN-0010', 'general', 'member'),
('GN-0011', 'general', 'member'),
('GN-0012', 'general', 'member'),
('GN-0013', 'general', 'member'),
('GN-0014', 'general', 'member'),
('GN-0015', 'general', 'member'),
('GN-0016', 'general', 'member'),
('GN-0017', 'general', 'member'),
('GN-0018', 'general', 'member'),
('GN-0019', 'general', 'member'),
('GN-0020', 'general', 'member')
ON CONFLICT (member_id) DO NOTHING;

-- Show statistics
SELECT 
  department,
  COUNT(*) as total_ids,
  COUNT(CASE WHEN assigned = TRUE THEN 1 END) as assigned_ids,
  COUNT(CASE WHEN assigned = FALSE THEN 1 END) as available_ids
FROM member_ids 
GROUP BY department
ORDER BY department;

-- Show some available Member IDs for testing
SELECT member_id, department, role, assigned
FROM member_ids 
WHERE assigned = FALSE
ORDER BY department, member_id
LIMIT 20;
