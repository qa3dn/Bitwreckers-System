-- تحديث بسيط لجدول personal_todos
-- إضافة الحقول الجديدة فقط إذا لم تكن موجودة

-- إضافة عمود completed إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_todos' AND column_name = 'completed') THEN
        ALTER TABLE personal_todos ADD COLUMN completed boolean DEFAULT false;
    END IF;
END $$;

-- إضافة عمود priority إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_todos' AND column_name = 'priority') THEN
        ALTER TABLE personal_todos ADD COLUMN priority text DEFAULT 'medium';
    END IF;
END $$;

-- إضافة عمود due_date إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_todos' AND column_name = 'due_date') THEN
        ALTER TABLE personal_todos ADD COLUMN due_date date;
    END IF;
END $$;

-- إضافة عمود tags إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_todos' AND column_name = 'tags') THEN
        ALTER TABLE personal_todos ADD COLUMN tags text[] DEFAULT '{}';
    END IF;
END $$;

-- إضافة عمود estimated_time إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_todos' AND column_name = 'estimated_time') THEN
        ALTER TABLE personal_todos ADD COLUMN estimated_time integer;
    END IF;
END $$;

-- إضافة عمود actual_time إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_todos' AND column_name = 'actual_time') THEN
        ALTER TABLE personal_todos ADD COLUMN actual_time integer;
    END IF;
END $$;

-- إضافة عمود category إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'personal_todos' AND column_name = 'category') THEN
        ALTER TABLE personal_todos ADD COLUMN category text;
    END IF;
END $$;

-- إضافة constraint للـ priority إذا لم يكن موجود
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'personal_todos_priority_check') THEN
        ALTER TABLE personal_todos ADD CONSTRAINT personal_todos_priority_check 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    END IF;
END $$;

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_personal_todos_completed ON personal_todos(completed);
CREATE INDEX IF NOT EXISTS idx_personal_todos_priority ON personal_todos(priority);
CREATE INDEX IF NOT EXISTS idx_personal_todos_due_date ON personal_todos(due_date);
CREATE INDEX IF NOT EXISTS idx_personal_todos_category ON personal_todos(category);
CREATE INDEX IF NOT EXISTS idx_personal_todos_user_id ON personal_todos(user_id);
