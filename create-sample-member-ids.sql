-- Create sample member IDs for testing
INSERT INTO member_ids (member_id, department, role) VALUES
('PR-1234', 'PR', 'member'),
('PR-5678', 'PR', 'member'),
('MED-1234', 'Media', 'member'),
('MED-5678', 'Media', 'member'),
('DEV-1234', 'Dev', 'member'),
('DEV-5678', 'Dev', 'member'),
('MGT-1234', 'Management', 'member'),
('MGT-5678', 'Management', 'member'),
('GEN-1234', 'General', 'member'),
('GEN-5678', 'General', 'member')
ON CONFLICT (member_id) DO NOTHING;
