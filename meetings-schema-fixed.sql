-- حذف السياسات الموجودة أولاً لتجنب التكرار
DROP POLICY IF EXISTS "Team leads can manage meetings" ON meetings;
DROP POLICY IF EXISTS "Authenticated users can view their meetings" ON meetings;
DROP POLICY IF EXISTS "Team leads can create meetings" ON meetings;
DROP POLICY IF EXISTS "Team leads can update meetings" ON meetings;
DROP POLICY IF EXISTS "Team leads can delete meetings" ON meetings;

DROP POLICY IF EXISTS "Authenticated users can view their meeting invitations" ON meeting_members;
DROP POLICY IF EXISTS "Team leads can insert meeting members" ON meeting_members;
DROP POLICY IF EXISTS "Users can update their meeting status" ON meeting_members;
DROP POLICY IF EXISTS "Team leads can delete meeting members" ON meeting_members;

-- حذف السياسات الموجودة للإشعارات
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Team leads can create notifications" ON notifications;

-- إضافة جدول الاجتماعات
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  meeting_date timestamp with time zone NOT NULL,
  meeting_link text,
  created_by uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- إضافة جدول أعضاء الاجتماعات
CREATE TABLE IF NOT EXISTS meeting_members (
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  PRIMARY KEY (meeting_id, user_id)
);

-- إضافة جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'general' CHECK (type IN ('general', 'meeting', 'task', 'project', 'message')),
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- إضافة RLS للجداول
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies للاجتماعات
CREATE POLICY "Authenticated users can view their meetings" ON meetings
  FOR SELECT USING (
    auth.uid() = created_by OR EXISTS (SELECT 1 FROM meeting_members WHERE meeting_id = meetings.id AND user_id = auth.uid())
  );

CREATE POLICY "Team leads can create meetings" ON meetings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

CREATE POLICY "Team leads can update meetings" ON meetings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

CREATE POLICY "Team leads can delete meetings" ON meetings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

-- Policies لأعضاء الاجتماعات
CREATE POLICY "Authenticated users can view their meeting invitations" ON meeting_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Team leads can insert meeting members" ON meeting_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

CREATE POLICY "Users can update their meeting status" ON meeting_members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Team leads can delete meeting members" ON meeting_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

-- Policies للإشعارات
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Team leads can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'team-lead'
    )
  );

-- إضافة الجداول للـ Realtime
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'meetings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'meeting_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE meeting_members;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
