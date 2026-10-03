-- ===============================================================
-- سكريبت إعداد المصادقة (Supabase Auth Integration)
-- نظام ابن السنوسي لإدارة الموارد (ERP)
-- Project: ibnalsanusi (ieumoqfkxpydyqsgwqvf)
-- ===============================================================

-- 1. التأكد من وجود جدول الموظفين
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT,
    password TEXT,
    role TEXT DEFAULT 'مبيعات',
    phone TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. دالة التزامن التلقائي عند تسجيل أي مستخدم جديد عبر Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.employees (id, name, username, role, phone, status, created_at)
    VALUES (
        NEW.id::TEXT,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'مدير'),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'active',
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. تفعيل الـ Trigger على جدول المستخدمين في Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. سياسات الوصول (Row Level Security - RLS)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public employees access" ON public.employees;
CREATE POLICY "Public employees access" ON public.employees 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- ===============================================================
-- ملاحظة هامة لإعدادات Supabase Auth في لوحة التحكم:
-- 1. انتقل إلى: Authentication -> Providers -> Email
-- 2. تأكد من تفعيل "Enable Email provider"
-- 3. إذا أردت السماح بالتسجيل الفوري بدون انتظار رسائل البريد:
--    قم بإلغاء تحديد خيار "Confirm email" واضغط Save.
-- ===============================================================
