import { supabase, SUPABASE_PROJECT_ID, SUPABASE_PROJECT_NAME } from './supabase';
import { Employee, EmployeeRole } from './types';
import { upsertEmployeeToSupabase, fetchEmployeesFromSupabase } from './supabaseService';

export interface AuthResponse {
  success: boolean;
  employee?: Employee;
  requiresEmailConfirmation?: boolean;
  error?: string;
}

// دالة مساعدة لتحويل اسم المستخدم أو البريد إلى بريد إلكتروني صالح لـ Supabase Auth
export function normalizeAuthEmail(emailOrUsername: string): string {
  const clean = emailOrUsername.trim();
  if (clean.includes('@')) {
    return clean.toLowerCase();
  }
  // إذا أدخل المستخدم اسم مستخدم فقط مثل "admin" يتم تحويله لبريد نطاق المنظومة
  return `${clean.toLowerCase()}@ibnalsanusi.com`;
}

// 1. تسجيل الدخول عبر Supabase Auth
export async function signInWithSupabase(
  emailOrUsername: string,
  password: string,
  fallbackEmployees: Employee[] = []
): Promise<AuthResponse> {
  const email = normalizeAuthEmail(emailOrUsername);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // إذا كان الخطأ بيانات اعتماد غير صحيحة، نتحقق أيضاً من الحسابات المحلية كإجراء احتياطي
      const localMatch = fallbackEmployees.find(
        emp => (emp.username?.toLowerCase() === emailOrUsername.toLowerCase() || emp.name === emailOrUsername) && emp.password === password
      );

      if (localMatch) {
        return {
          success: true,
          employee: localMatch,
        };
      }

      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: 'اسم المستخدم/البريد أو كلمة المرور غير صحيحة.' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { 
          success: false, 
          error: 'البريد الإلكتروني بحاجة لتأكيد، أو قم بإلغاء خيار (Confirm email) من إعدادات Supabase Auth.' 
        };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'لم يتم العثور على بيانات المستخدم.' };
    }

    // جلب بيانات الموظف المرتبطة بالحساب
    const meta = data.user.user_metadata || {};
    let employeeRole = (meta.role as EmployeeRole) || EmployeeRole.MANAGER;
    let employeeName = meta.name || emailOrUsername.split('@')[0];
    let employeePhone = meta.phone || '';

    // التحقق من جدول الموظفين السحابي إن وجد
    try {
      const { data: empRow } = await supabase
        .from('employees')
        .select('*')
        .or(`id.eq.${data.user.id},username.eq.${emailOrUsername}`)
        .maybeSingle();

      if (empRow) {
        employeeName = empRow.name || employeeName;
        employeeRole = (empRow.role as EmployeeRole) || employeeRole;
        employeePhone = empRow.phone || employeePhone;
      }
    } catch {
      // تجاوز أي خطأ في قراءة الجدول
    }

    const employee: Employee = {
      id: data.user.id,
      name: employeeName,
      username: meta.username || emailOrUsername,
      role: employeeRole,
      phone: employeePhone,
      status: 'active',
    };

    // حفظ / تحديث في جدول الموظفين السحابي
    upsertEmployeeToSupabase(employee).catch(() => {});

    return {
      success: true,
      employee,
    };
  } catch (err: any) {
    // محاولة أخيرة عبر الحسابات المحلية في حال انقطاع الشبكة
    const localMatch = fallbackEmployees.find(
      emp => (emp.username?.toLowerCase() === emailOrUsername.toLowerCase() || emp.name === emailOrUsername) && emp.password === password
    );
    if (localMatch) {
      return { success: true, employee: localMatch };
    }

    return {
      success: false,
      error: err?.message || 'حدث خطأ أثناء الاتصال بخادم المصادقة.',
    };
  }
}

// 2. إنشاء حساب جديد عبر Supabase Auth
export async function signUpWithSupabase(params: {
  name: string;
  username: string;
  password: string;
  email?: string;
  role?: EmployeeRole;
  phone?: string;
}): Promise<AuthResponse> {
  const email = params.email?.trim() || normalizeAuthEmail(params.username);
  const role = params.role || EmployeeRole.MANAGER;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: params.password,
      options: {
        data: {
          name: params.name,
          username: params.username,
          role,
          phone: params.phone || '',
        },
      },
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        return { success: false, error: 'هذا المستخدم أو البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.' };
      }
      return { success: false, error: error.message };
    }

    const newUserId = data.user?.id || Date.now().toString();
    const newEmployee: Employee = {
      id: newUserId,
      name: params.name,
      username: params.username,
      password: params.password,
      role,
      phone: params.phone || '',
      status: 'active',
    };

    // حفظ في جدول الموظفين السحابي
    upsertEmployeeToSupabase(newEmployee).catch(() => {});

    // هل يتطلب تأكيد البريد؟ (إذا لم تكن الجلسة مفعلة فوراً)
    const requiresEmailConfirmation = !data.session;

    return {
      success: true,
      employee: newEmployee,
      requiresEmailConfirmation,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'تعذر إنشاء الحساب عبر Supabase Auth.',
    };
  }
}

// 3. تسجيل الخروج من Supabase Auth
export async function signOutFromSupabase(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase signOut error:', err);
  }
}

// 4. استرجاع المستخدم الحالي من جلسة Supabase
export async function getCurrentSupabaseUser(): Promise<Employee | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return null;

    const user = session.user;
    const meta = user.user_metadata || {};

    return {
      id: user.id,
      name: meta.name || user.email?.split('@')[0] || 'مستخدم',
      username: meta.username || user.email || '',
      role: (meta.role as EmployeeRole) || EmployeeRole.MANAGER,
      phone: meta.phone || '',
      status: 'active',
    };
  } catch {
    return null;
  }
}
