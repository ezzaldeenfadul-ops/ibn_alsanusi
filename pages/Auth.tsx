import React, { useState } from 'react';
import { Employee } from '../types';
import { signInWithSupabase } from '../authService';
import { SUPABASE_PROJECT_NAME } from '../supabase';
import { Lock, User, Eye, EyeOff, ShieldCheck } from '../components/Icons';

interface AuthProps {
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  onLogin: (employee: Employee) => void;
}

const Auth: React.FC<AuthProps> = ({ employees, onLogin }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = usernameOrEmail.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('يرجى إدخال اسم المستخدم (أو البريد الإلكتروني) وكلمة المرور.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signInWithSupabase(cleanUser, cleanPass, employees);

      if (result.success && result.employee) {
        onLogin(result.employee);
      } else {
        setError(result.error || 'اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ غير متوقع أثناء معالجة تسجيل الدخول.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-dark to-slate-950 flex items-center justify-center p-4">
      {/* Decorative background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 animate-fade-in text-gray-800">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-3">
            <img 
              src="/Logo.png" 
              alt="ابن السنوسي" 
              className="w-24 h-24 mx-auto object-contain drop-shadow-md" 
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ابن السنوسي للطاقة</h1>
          <p className="text-gray-500 text-xs mt-1 font-medium">نظام تخطيط الموارد وإدارة المبيعات المتكامل (ERP & POS)</p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>بوابة تسجيل الدخول الآمنة ({SUPABASE_PROJECT_NAME})</span>
          </div>
        </div>

        {/* Login Form Only */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username / Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-blue" />
              <span>اسم المستخدم أو البريد الإلكتروني</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all bg-gray-50/50 hover:bg-white focus:bg-white text-gray-900"
                placeholder="أدخل اسم المستخدم أو البريد الإلكتروني"
                dir="ltr"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-brand-blue" />
                <span>كلمة المرور</span>
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all bg-gray-50/50 hover:bg-white focus:bg-white text-gray-900 pr-4 pl-11"
                placeholder="••••••••"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold animate-fade-in flex items-start gap-2 leading-relaxed">
              <span className="shrink-0 text-sm">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-brand-blue hover:bg-blue-800 text-white rounded-xl transition-all font-bold shadow-lg shadow-blue-900/25 active:scale-98 disabled:opacity-50 text-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>جاري التحقق وتسجيل الدخول...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info - restricted access notice */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          <p className="flex items-center justify-center gap-1.5 text-gray-500 font-medium">
            <span>🔒</span>
            <span>الدخول مصرح به فقط لموظفي وإدارة الشركة</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            يتم إصدار وتعيين صلاحيات الحسابات من خلال لوحة إدارة الموظفين
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
