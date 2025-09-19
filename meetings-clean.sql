-- حذف جميع السياسات الموجودة للاجتماعات
DROP POLICY IF EXISTS "Team leads can manage meetings" ON meetings;
DROP POLICY IF EXISTS "Authenticated users can view their meetings" ON meetings;
DROP POLICY IF EXISTS "Team leads can create meetings" ON meetings;
DROP POLICY IF EXISTS "Team leads can update meetings" ON meetings;
DROP POLICY IF EXISTS "Team leads can delete meetings" ON meetings;
DROP POLICY IF EXISTS "Users can view all meetings" ON meetings;
DROP POLICY IF EXISTS "Allow all users to view meetings" ON meetings;
DROP POLICY IF EXISTS "view_meetings" ON meetings;
DROP POLICY IF EXISTS "meetings_select" ON meetings;
DROP POLICY IF EXISTS "msg_select_2024" ON meetings;
DROP POLICY IF EXISTS "msg_select_2025" ON meetings;

-- حذف جميع السياسات الموجودة لأعضاء الاجتماعات
DROP POLICY IF EXISTS "Authenticated users can view their meeting invitations" ON meeting_members;
DROP POLICY IF EXISTS "Team leads can insert meeting members" ON meeting_members;
DROP POLICY IF EXISTS "Users can update their meeting status" ON meeting_members;
DROP POLICY IF EXISTS "Team leads can delete meeting members" ON meeting_members;
DROP POLICY IF EXISTS "Users can view all meeting members" ON meeting_members;
DROP POLICY IF EXISTS "Allow all users to view meeting members" ON meeting_members;
DROP POLICY IF EXISTS "view_meeting_members" ON meeting_members;
DROP POLICY IF EXISTS "meeting_members_select" ON meeting_members;

-- حذف جميع السياسات الموجودة للإشعارات
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Team leads can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Allow all users to view notifications" ON notifications;
DROP POLICY IF EXISTS "view_notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select" ON notifications;

-- إزالة الجداول من Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS meetings;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS meeting_members;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS notifications;

-- إنشاء جدول الاجتماعات
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

-- إنشاء جدول أعضاء الاجتماعات
CREATE TABLE IF NOT EXISTS meeting_members (
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  PRIMARY KEY (meeting_id, user_id)
);

-- إنشاء جدول الإشعارات
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

-- تفعيل RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الاجتماعات
CREATE POLICY "meetings_view_policy" ON meetings
  FOR SELECT USING (
    auth.uid() = created_by OR EXISTS (SELECT 1 FROM meeting_members WHERE meeting_id = meetings.id AND user_id = auth.uid())
  );

CREATE POLICY "meetings_insert_policy" ON meetings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

CREATE POLICY "meetings_update_policy" ON meetings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

CREATE POLICY "meetings_delete_policy" ON meetings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

-- إنشاء سياسات أعضاء الاجتماعات
CREATE POLICY "meeting_members_view_policy" ON meeting_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "meeting_members_insert_policy" ON meeting_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

CREATE POLICY "meeting_members_update_policy" ON meeting_members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "meeting_members_delete_policy" ON meeting_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

-- إنشاء سياسات الإشعارات
CREATE POLICY "notifications_view_policy" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_policy" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_policy" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

-- إضافة الجداول للـ Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_members;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
