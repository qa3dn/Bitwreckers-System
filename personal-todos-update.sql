-- تحديث جدول personal_todos لإضافة الحقول الجديدة
ALTER TABLE personal_todos 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS due_date date,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS estimated_time integer,
ADD COLUMN IF NOT EXISTS actual_time integer,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;

-- إنشاء فهرس للحقول الجديدة لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_personal_todos_priority ON personal_todos(priority);
CREATE INDEX IF NOT EXISTS idx_personal_todos_due_date ON personal_todos(due_date);
CREATE INDEX IF NOT EXISTS idx_personal_todos_completed ON personal_todos(completed);
CREATE INDEX IF NOT EXISTS idx_personal_todos_category ON personal_todos(category);
CREATE INDEX IF NOT EXISTS idx_personal_todos_user_id ON personal_todos(user_id);

-- تحديث RLS policies للجدول المحدث
DROP POLICY IF EXISTS "Users can view their own personal todos" ON personal_todos;
DROP POLICY IF EXISTS "Users can insert their own personal todos" ON personal_todos;
DROP POLICY IF EXISTS "Users can update their own personal todos" ON personal_todos;
DROP POLICY IF EXISTS "Users can delete their own personal todos" ON personal_todos;

CREATE POLICY "Users can view their own personal todos" ON personal_todos
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own personal todos" ON personal_todos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own personal todos" ON personal_todos
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own personal todos" ON personal_todos
  FOR DELETE USING (user_id = auth.uid());
