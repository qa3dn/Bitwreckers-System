-- الحل النهائي: حذف الجداول وإعادة إنشائها
DROP TABLE IF EXISTS meeting_members CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- إنشاء جدول الاجتماعات
CREATE TABLE meetings (
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
CREATE TABLE meeting_members (
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  PRIMARY KEY (meeting_id, user_id)
);

-- إنشاء جدول الإشعارات
CREATE TABLE notifications (
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
CREATE POLICY "meetings_select" ON meetings
  FOR SELECT USING (
    auth.uid() = created_by OR EXISTS (SELECT 1 FROM meeting_members WHERE meeting_id = meetings.id AND user_id = auth.uid())
  );

CREATE POLICY "meetings_insert" ON meetings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

CREATE POLICY "meetings_update" ON meetings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

CREATE POLICY "meetings_delete" ON meetings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

-- إنشاء سياسات أعضاء الاجتماعات
CREATE POLICY "meeting_members_select" ON meeting_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "meeting_members_insert" ON meeting_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

CREATE POLICY "meeting_members_update" ON meeting_members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "meeting_members_delete" ON meeting_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

-- إنشاء سياسات الإشعارات
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'team-lead')
  );

-- إضافة الجداول للـ Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_members;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
