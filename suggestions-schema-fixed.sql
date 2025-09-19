-- Suggestions System Database Schema - Fixed Version
-- Handle existing data and constraints properly

-- First, let's check and fix the users table department constraint
-- Drop the existing constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_department;

-- Update existing users to have valid department values
UPDATE users 
SET department = 'General' 
WHERE department IS NULL OR department NOT IN ('PR', 'Media', 'Dev', 'Management', 'General');

-- Now add the constraint back
ALTER TABLE users ADD CONSTRAINT check_department 
CHECK (department IN ('PR', 'Media', 'Dev', 'Management', 'General'));

-- Create suggestions table if it doesn't exist
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT NOT NULL,
  importance_reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  department TEXT,
  estimated_budget DECIMAL(10,2),
  estimated_duration INTEGER, -- in days
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT
);

-- Add department column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;

-- Enable RLS on suggestions table
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own suggestions" ON suggestions;
DROP POLICY IF EXISTS "Team leaders can view all suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can insert their own suggestions" ON suggestions;
DROP POLICY IF EXISTS "Team leaders can update suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can update their own pending suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can delete their own pending suggestions" ON suggestions;

-- Create RLS policies for suggestions
-- Users can view their own suggestions
CREATE POLICY "Users can view their own suggestions"
ON suggestions FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Team leaders can view all suggestions
CREATE POLICY "Team leaders can view all suggestions"
ON suggestions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'team-lead'
  )
);

-- Users can insert their own suggestions
CREATE POLICY "Users can insert their own suggestions"
ON suggestions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Team leaders can update suggestions (for review)
CREATE POLICY "Team leaders can update suggestions"
ON suggestions FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'team-lead'
  )
);

-- Users can update their own suggestions (if not reviewed)
CREATE POLICY "Users can update their own pending suggestions"
ON suggestions FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() 
  AND status = 'pending'
);

-- Users can delete their own suggestions (if not reviewed)
CREATE POLICY "Users can delete their own pending suggestions"
ON suggestions FOR DELETE TO authenticated
USING (
  user_id = auth.uid() 
  AND status = 'pending'
);

-- Enable Realtime for suggestions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'suggestions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE suggestions;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_department ON suggestions(department);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at);
