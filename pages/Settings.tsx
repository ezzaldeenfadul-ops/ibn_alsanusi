import React, { useState, useEffect } from 'react';
import { Employee, EmployeeRole, Product, Customer, Supplier, Invoice, PurchaseOrder } from '../types';
import { Settings as SettingsIcon, Users, Package, Trash, Plus, Clock, Database, Cloud, RefreshCw, CheckCircle2, AlertTriangle } from '../components/Icons';
import { 
  checkSupabaseConnection, 
  syncAllLocalDataToSupabase, 
  fetchProductsFromSupabase,
  fetchCustomersFromSupabase,
  fetchSuppliersFromSupabase,
  fetchInvoicesFromSupabase,
  fetchPurchaseOrdersFromSupabase,
  fetchEmployeesFromSupabase,
  fetchCategoriesFromSupabase,
  SupabaseStatus
} from '../supabaseService';
import { SUPABASE_PROJECT_ID, SUPABASE_PROJECT_NAME } from '../supabase';

interface SettingsProps {
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  productCategories: string[];
  setProductCategories: (categories: string[]) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  customers?: Customer[];
  setCustomers?: (customers: Customer[]) => void;
  suppliers?: Supplier[];
  setSuppliers?: (suppliers: Supplier[]) => void;
  invoices?: Invoice[];
  setInvoices?: (invoices: Invoice[]) => void;
  purchaseOrders?: PurchaseOrder[];
  setPurchaseOrders?: (orders: PurchaseOrder[]) => void;
  currentUser: Employee;
  onWipeAllData?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  employees, setEmployees, 
  productCategories, setProductCategories,
  products, setProducts,
  customers = [], setCustomers,
  suppliers = [], setSuppliers,
  invoices = [], setInvoices,
  purchaseOrders = [], setPurchaseOrders,
  currentUser,
  onWipeAllData
}) => {
  const [activeTab, setActiveTab] = useState<'system' | 'employees' | 'products' | 'database'>('system');

  // Supabase Database State
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const rawSqlSchema = `-- 1. جدول المنتجات
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    sku TEXT,
    name TEXT NOT NULL,
    category TEXT,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    price NUMERIC(14, 2) DEFAULT 0,
    cost NUMERIC(14, 2) DEFAULT 0,
    specs TEXT,
    track_serial BOOLEAN DEFAULT FALSE,
    serial_numbers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول العملاء
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    type TEXT DEFAULT 'فرد',
    address TEXT,
    email TEXT,
    balance NUMERIC(14, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول الموردين
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول فواتير المبيعات
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    customer_name TEXT,
    date TEXT,
    time TEXT,
    employee_name TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(14, 2) DEFAULT 0,
    tax NUMERIC(14, 2) DEFAULT 0,
    discount NUMERIC(14, 2) DEFAULT 0,
    total NUMERIC(14, 2) DEFAULT 0,
    paid_amount NUMERIC(14, 2) DEFAULT 0,
    status TEXT DEFAULT 'مدفوع',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول أوامر الشراء
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id TEXT PRIMARY KEY,
    supplier_id TEXT,
    supplier_name TEXT,
    date TEXT,
    status TEXT DEFAULT 'ordered',
    total NUMERIC(14, 2) DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. جدول الموظفين
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT,
    password TEXT,
    role TEXT DEFAULT 'مبيعات',
    phone TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. جدول الإعدادات
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل سياسات الوصول
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- ربط وتزامن مستخدمي Supabase Auth مع جدول الموظفين تلقائياً
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
        phone = EXCLUDED.phone;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();`;

  const handleCheckConnection = async () => {
    setIsCheckingConnection(true);
    setSyncFeedback(null);
    try {
      const status = await checkSupabaseConnection();
      setSupabaseStatus(status);
      if (status.connected && status.tablesExist) {
        setSyncFeedback({ type: 'success', text: 'تم الاتصال بنجاح بـ Supabase والجداول السحابية جاهزة!' });
      } else if (status.connected && !status.tablesExist) {
        setSyncFeedback({ type: 'info', text: 'مشروع Supabase متصل، يرجى تشغيل كود SQL أدناه لإنشاء الجداول.' });
      } else {
        setSyncFeedback({ type: 'error', text: `فشل الاتصال: ${status.error || 'تأكد من إعدادات الشبكة'}` });
      }
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(rawSqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSyncToCloud = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const result = await syncAllLocalDataToSupabase({
        products,
        customers,
        suppliers,
        invoices,
        purchaseOrders,
        employees,
        categories: productCategories,
      });

      if (result.success) {
        setSyncFeedback({ type: 'success', text: 'تم رفع كافة البيانات المحلية إلى Supabase بنجاح!' });
        await handleCheckConnection();
      } else {
        setSyncFeedback({ type: 'error', text: `تعذر الرفع: ${result.message}` });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!window.confirm('هل تريد استبدال البيانات المحلية الحالية بالبيانات الموجودة على Supabase؟')) {
      return;
    }
    setIsPulling(true);
    setSyncFeedback(null);
    try {
      const [
        cloudProducts,
        cloudCustomers,
        cloudSuppliers,
        cloudInvoices,
        cloudOrders,
        cloudEmployees,
        cloudCategories,
      ] = await Promise.all([
        fetchProductsFromSupabase(),
        fetchCustomersFromSupabase(),
        fetchSuppliersFromSupabase(),
        fetchInvoicesFromSupabase(),
        fetchPurchaseOrdersFromSupabase(),
        fetchEmployeesFromSupabase(),
        fetchCategoriesFromSupabase(),
      ]);

      let updatedCount = 0;
      if (cloudProducts && cloudProducts.length > 0) {
        setProducts(cloudProducts);
        updatedCount++;
      }
      if (cloudCustomers && setCustomers && cloudCustomers.length > 0) {
        setCustomers(cloudCustomers);
        updatedCount++;
      }
      if (cloudSuppliers && setSuppliers && cloudSuppliers.length > 0) {
        setSuppliers(cloudSuppliers);
        updatedCount++;
      }
      if (cloudInvoices && setInvoices && cloudInvoices.length > 0) {
        setInvoices(cloudInvoices);
        updatedCount++;
      }
      if (cloudOrders && setPurchaseOrders && cloudOrders.length > 0) {
        setPurchaseOrders(cloudOrders);
        updatedCount++;
      }
      if (cloudEmployees && cloudEmployees.length > 0) {
        setEmployees(cloudEmployees);
        updatedCount++;
      }
      if (cloudCategories && cloudCategories.length > 0) {
        setProductCategories(cloudCategories);
        updatedCount++;
      }

      setSyncFeedback({ 
        type: 'success', 
        text: `تم استرجاع وتحديث البيانات السحابية بنجاح (${updatedCount} أقسام تم تحديثها)!` 
      });
    } catch (err: any) {
      setSyncFeedback({ type: 'error', text: `فشل جلب البيانات: ${err?.message || 'خطأ غير متوقع'}` });
    } finally {
      setIsPulling(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'database' && !supabaseStatus) {
      handleCheckConnection();
    }
  }, [activeTab]);


  // Employee Add State
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpUsername, setNewEmpUsername] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<EmployeeRole>(EmployeeRole.SALES);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpUsername || !newEmpPassword) return;
    
    // Check if username already exists
    if (employees.some(emp => emp.username === newEmpUsername)) {
      alert('اسم المستخدم موجود مسبقاً، يرجى اختيار اسم آخر.');
      return;
    }

    const newEmp: Employee = {
      id: Date.now().toString(),
      name: newEmpName,
      username: newEmpUsername,
      password: newEmpPassword,
      phone: newEmpPhone,
      role: newEmpRole,
      status: 'active'
    };
    setEmployees([...employees, newEmp]);
    setNewEmpName('');
    setNewEmpPhone('');
    setNewEmpUsername('');
    setNewEmpPassword('');
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  // Categories Add State
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory || productCategories.includes(newCategory)) return;
    setProductCategories([...productCategories, newCategory]);
    setNewCategory('');
  };

  const handleDeleteCategory = (category: string) => {
    setProductCategories(productCategories.filter(c => c !== category));
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // System Time Simulation
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">الإعدادات</h2>
        <p className="text-gray-500 text-sm">إدارة إعدادات النظام، المستخدمين، والأصناف</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-gray-50 flex flex-row md:flex-col p-4 gap-2 border-b md:border-b-0 md:border-l border-gray-100 custom-scrollbar overflow-x-auto">
          <button 
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap
              ${activeTab === 'system' ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <Clock className="w-5 h-5" />
            إعدادات النظام
          </button>
          <button 
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap
              ${activeTab === 'employees' ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <Users className="w-5 h-5" />
            الموظفين والمستخدمين
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap
              ${activeTab === 'products' ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <Package className="w-5 h-5" />
            المنتجات والأصناف
          </button>
          <button 
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap
              ${activeTab === 'database' ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <Database className="w-5 h-5" />
            قاعدة البيانات (Supabase)
            <span className="mr-auto flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${supabaseStatus?.connected ? 'bg-green-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${supabaseStatus?.connected ? 'bg-green-500' : 'bg-amber-500'}`}></span>
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 lg:p-8 min-h-[500px]">
          {activeTab === 'system' && (
            <div className="space-y-8 animate-slide-in">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">التاريخ والوقت</h3>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col md:flex-row gap-8 items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 mb-1">الوقت الحالي</p>
                    <p className="text-4xl font-mono text-brand-blue font-bold tracking-wider" dir="ltr">
                      {currentTime.toLocaleTimeString('ar-SA')}
                    </p>
                  </div>
                  <div className="hidden md:block w-px h-16 bg-gray-200"></div>
                  <div className="text-center">
                    <p className="text-gray-500 mb-1">تاريخ اليوم</p>
                    <p className="text-2xl font-bold text-gray-700">
                      {currentTime.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center text-balance">* ملاحظة: يتم جلب الوقت والتاريخ تلقائياً من خوادم النظام المحلي الخاص بجهازك.</p>
              </div>

              <div>
                 <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">إعدادات المتجر</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">اسم المتجر</label>
                        <input type="text" value="ابن السنوسي للطاقة" disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">الرقم الضريبي</label>
                        <input type="text" value="300000000000003" disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500" />
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-8 animate-slide-in">
              {currentUser.role === EmployeeRole.MANAGER ? (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">إضافة موظف/مستخدم جديد</h3>
                  <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">اسم الموظف</label>
                      <input required type="text" value={newEmpName} onChange={e=>setNewEmpName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">اسم المستخدم (للدخول)</label>
                      <input required type="text" value={newEmpUsername} onChange={e=>setNewEmpUsername(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">كلمة المرور</label>
                      <input required type="password" value={newEmpPassword} onChange={e=>setNewEmpPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">رقم الهاتف <span className="text-gray-400 font-normal">(اختياري)</span></label>
                      <input type="text" value={newEmpPhone} onChange={e=>setNewEmpPhone(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">الصلاحية / الدور</label>
                      <select value={newEmpRole} onChange={e=>setNewEmpRole(e.target.value as EmployeeRole)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 bg-white cursor-pointer">
                        {Object.values(EmployeeRole).map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="w-full px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-800 transition-colors font-medium h-[42px] shadow-md">
                      إضافة
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                  <p className="font-medium text-sm">عذراً، فقط المدير العام (Admin) يملك صلاحية إضافة أو إدارة الحسابات.</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">قائمة الموظفين</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-100 text-gray-600 text-sm">
                            <tr>
                                <th className="p-3 font-bold">الاسم</th>
                                <th className="p-3 font-bold">اسم المستخدم</th>
                                <th className="p-3 font-bold">الدور</th>
                                <th className="p-3 font-bold">رقم الهاتف</th>
                                {currentUser.role === EmployeeRole.MANAGER && <th className="p-3 font-bold text-center">إجراء</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {employees.map(emp => (
                                <tr key={emp.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-medium text-gray-800">{emp.name}</td>
                                    <td className="p-3 font-mono text-gray-500 text-sm">{emp.username}</td>
                                    <td className="p-3 text-brand-blue text-sm font-bold">{emp.role}</td>
                                    <td className="p-3 text-gray-500 font-mono text-sm">{emp.phone || '-'}</td>
                                    {currentUser.role === EmployeeRole.MANAGER && (
                                      <td className="p-3 text-center">
                                          <button 
                                            onClick={() => handleDeleteEmployee(emp.id)} 
                                            disabled={emp.id === currentUser.id}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                          >
                                              <Trash className="w-4 h-4" />
                                          </button>
                                      </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-8 animate-slide-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Categories Management */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">إدارة الأصناف (التصنيفات)</h3>
                  <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                    <input 
                      required 
                      type="text" 
                      placeholder="اسم الصنف الجديد..."
                      value={newCategory} 
                      onChange={e=>setNewCategory(e.target.value)} 
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" 
                    />
                    <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-800 transition-colors shadow flex items-center justify-center">
                      <Plus className="w-5 h-5 drop-shadow-sm" />
                    </button>
                  </form>
                  <ul className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {productCategories.map(cat => (
                      <li key={cat} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                        <span className="font-medium text-gray-700">{cat}</span>
                        <button onClick={() => handleDeleteCategory(cat)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Products Management List */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">حذف المنتجات</h3>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {products.map(product => (
                      <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-gray-800 text-sm truncate">{product.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                        </div>
                        <button onClick={() => handleDeleteProduct(product.id)} className="text-red-400 hover:text-red-600 p-2 bg-white rounded-md shadow-sm border border-gray-100 shrink-0">
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {products.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">لا توجد منتجات مسجلة</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-8 animate-slide-in">
              {/* Header Card */}
              <div className="bg-gradient-to-l from-brand-blue to-blue-900 text-white p-6 rounded-2xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-brand-yellow border border-white/20">
                      <Database className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        قاعدة بيانات Supabase السحابية
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          PostgreSQL Cloud
                        </span>
                      </h3>
                      <p className="text-sm text-blue-200 mt-1">
                        إدارة المزامنة اللحظية والنسخ الاحتياطي السحابي لنظام ابن السنوسي
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckConnection}
                    disabled={isCheckingConnection}
                    className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl transition-all border border-white/20 text-sm font-medium disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isCheckingConnection ? 'animate-spin' : ''}`} />
                    <span>{isCheckingConnection ? 'جاري الفحص...' : 'فحص الاتصال'}</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              {syncFeedback && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
                  syncFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  syncFeedback.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                  'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {syncFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : syncFeedback.type === 'error' ? (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : (
                    <Cloud className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <p className="text-sm font-medium">{syncFeedback.text}</p>
                </div>
              )}

              {/* Connection Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
                  <p className="text-xs text-gray-500 font-medium mb-1">اسم المشروع (Project Name)</p>
                  <p className="font-bold text-gray-800 text-base">{SUPABASE_PROJECT_NAME}</p>
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-blue-100 text-brand-blue font-mono">
                    Cloud Instance
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
                  <p className="text-xs text-gray-500 font-medium mb-1">معرّف المشروع (Project ID)</p>
                  <p className="font-bold font-mono text-gray-800 text-sm" dir="ltr">{SUPABASE_PROJECT_ID}</p>
                  <p className="text-xs text-gray-400 mt-2 truncate" dir="ltr">https://{SUPABASE_PROJECT_ID}.supabase.co</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
                  <p className="text-xs text-gray-500 font-medium mb-1">حالة الاتصال والخدمة</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-3 h-3 rounded-full ${
                      supabaseStatus?.connected ? (supabaseStatus.tablesExist ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-rose-500'
                    }`}></span>
                    <span className="font-bold text-sm text-gray-800">
                      {supabaseStatus?.connected 
                        ? (supabaseStatus.tablesExist ? 'متصل وجاهز للمزامنة' : 'متصل (بانتظار إنشاء الجداول)') 
                        : 'جاري فحص الاتصال...'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {supabaseStatus?.tablesExist ? 'الجداول السحابية متزامنة' : 'يمكنك إنشاء الجداول بنقرة واحدة أدناه'}
                  </p>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-brand-blue" />
                  أدوات المزامنة السحابية (Cloud Sync)
                </h4>
                <p className="text-sm text-gray-600">
                  يمكنك رفع البيانات المحلية الحالية بالكامل (المخزون، الفواتير، الموردين، العملاء، الموظفين) إلى سحابة Supabase، أو استرجاعها لجهازك في أي وقت:
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={handleSyncToCloud}
                    disabled={isSyncing}
                    className="flex items-center gap-2 bg-brand-blue hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Cloud className={`w-5 h-5 ${isSyncing ? 'animate-pulse' : ''}`} />
                    <span>{isSyncing ? 'جاري الرفع إلى Supabase...' : 'رفع كافة البيانات إلى Supabase (Push)'}</span>
                  </button>

                  <button
                    onClick={handlePullFromCloud}
                    disabled={isPulling}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl font-medium border border-gray-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${isPulling ? 'animate-spin' : ''}`} />
                    <span>{isPulling ? 'جاري الجلب...' : 'استرجاع البيانات من Supabase (Pull)'}</span>
                  </button>

                  {onWipeAllData && (
                    <button
                      onClick={onWipeAllData}
                      className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-5 py-2.5 rounded-xl font-bold border border-rose-200 transition-all active:scale-95"
                      title="مسح وتصفير كافة المنتجات والفواتير والموردين والعملاء"
                    >
                      <Trash className="w-5 h-5 text-rose-600" />
                      <span>تصفير ومسح كافة البيانات نهائياً</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Step by Step Guide & SQL Script */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
                      <span>⚡</span>
                      إعداد الجداول السحابية (SQL Schema)
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      إذا لم تقم بتنفيذ كود الجداول بعد في لوحة تحكم Supabase، انسخ الكود التالي وقم بتشغيله في SQL Editor:
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleCopySql}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{copiedSql ? 'تم نسخ الكود!' : 'نسخ كود SQL'}</span>
                    </button>

                    <a
                      href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-brand-blue hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      <span>فتح SQL Editor</span>
                      <span className="text-xs" dir="ltr">↗</span>
                    </a>
                  </div>
                </div>

                {/* Instructions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-100">
                  <div className="flex gap-2 items-start">
                    <span className="w-5 h-5 rounded-full bg-brand-blue/10 text-brand-blue font-bold flex items-center justify-center shrink-0">1</span>
                    <span>اضغط على <b>نسخ كود SQL</b> في الأعلى.</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="w-5 h-5 rounded-full bg-brand-blue/10 text-brand-blue font-bold flex items-center justify-center shrink-0">2</span>
                    <span>افتح <b>SQL Editor</b> في لوحة Supabase والصق الكود ثم اضغط <b>Run</b>.</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="w-5 h-5 rounded-full bg-brand-blue/10 text-brand-blue font-bold flex items-center justify-center shrink-0">3</span>
                    <span>ارجع هنا واضغط <b>فحص الاتصال</b> ثم <b>رفع كافة البيانات</b> لتبدأ المزامنة التلقائية.</span>
                  </div>
                </div>

                {/* Code Preview */}
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[220px] custom-scrollbar text-left" dir="ltr">
                    <code>{rawSqlSchema}</code>
                  </pre>
                </div>

                {/* Supabase Auth Settings Tip */}
                <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-xl text-xs text-amber-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-sm">
                    <span>🔐</span>
                    تفعيل التسجيل الفوري في Supabase Auth (بدون انتظار إيميل تفعيل):
                  </p>
                  <p>
                    في لوحة تحكم Supabase، اذهب إلى <b>Authentication</b> ← <b>Providers</b> ← <b>Email</b>، ثم قم بإلغاء خيار <b>Confirm email</b> واضغط <b>Save</b> لتتمكن من تسجيل الدخول وإنشاء حسابات الموظفين فوراً دون الحاجة لتهيئة خادم إرسال بريد إلكتروني (SMTP).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
