import { supabase, SUPABASE_PROJECT_ID, SUPABASE_PROJECT_NAME } from './supabase';
import { 
  Product, Customer, Supplier, Invoice, PurchaseOrder, Employee, 
  CustomerType, InvoiceStatus, EmployeeRole 
} from './types';

export interface SupabaseStatus {
  connected: boolean;
  tablesExist: boolean;
  error?: string;
  projectId: string;
  projectName: string;
}

export interface CloudDataBundle {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  employees: Employee[];
  categories: string[];
}

// 1. فحص حالة الاتصال بالسيرفر وجاهزية الجداول
export async function checkSupabaseConnection(): Promise<SupabaseStatus> {
  try {
    const { error } = await supabase.from('products').select('id').limit(1);

    if (!error) {
      return {
        connected: true,
        tablesExist: true,
        projectId: SUPABASE_PROJECT_ID,
        projectName: SUPABASE_PROJECT_NAME,
      };
    }

    if (
      error.code === 'PGRST205' || 
      error.message?.includes('schema cache') || 
      error.message?.includes('relation "public.products" does not exist') ||
      error.message?.includes('does not exist')
    ) {
      return {
        connected: true,
        tablesExist: false,
        error: 'مشروع Supabase متصل بنجاح، بانتظار تنفيذ كود SQL لإنشاء الجداول.',
        projectId: SUPABASE_PROJECT_ID,
        projectName: SUPABASE_PROJECT_NAME,
      };
    }

    return {
      connected: false,
      tablesExist: false,
      error: error.message,
      projectId: SUPABASE_PROJECT_ID,
      projectName: SUPABASE_PROJECT_NAME,
    };
  } catch (err: any) {
    return {
      connected: false,
      tablesExist: false,
      error: err?.message || 'تعذر الاتصال بـ Supabase',
      projectId: SUPABASE_PROJECT_ID,
      projectName: SUPABASE_PROJECT_NAME,
    };
  }
}

// ===============================================================
// دوال جلب البيانات الشاملة (Data Fetching Pipeline)
// ===============================================================

export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  try {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (!data) return null;

    return data.map((row: any) => ({
      id: row.id,
      sku: row.sku || '',
      name: row.name,
      category: row.category || 'عام',
      stock: Number(row.stock || 0),
      minStock: Number(row.min_stock || 0),
      price: Number(row.price || 0),
      cost: Number(row.cost || 0),
      specs: row.specs || '',
      trackSerial: Boolean(row.track_serial),
      serialNumbers: Array.isArray(row.serial_numbers) ? row.serial_numbers : [],
    }));
  } catch (err) {
    console.warn('Supabase fetchProducts failed:', err);
    return null;
  }
}

export async function fetchCustomersFromSupabase(): Promise<Customer[] | null> {
  try {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (!data) return null;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      phone: row.phone || '',
      type: (row.type as CustomerType) || CustomerType.INDIVIDUAL,
      address: row.address || '',
      email: row.email || '',
      balance: Number(row.balance || 0),
    }));
  } catch (err) {
    console.warn('Supabase fetchCustomers failed:', err);
    return null;
  }
}

export async function fetchSuppliersFromSupabase(): Promise<Supplier[] | null> {
  try {
    const { data, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (!data) return null;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      contactPerson: row.contact_person || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
    }));
  } catch (err) {
    console.warn('Supabase fetchSuppliers failed:', err);
    return null;
  }
}

export async function fetchInvoicesFromSupabase(): Promise<Invoice[] | null> {
  try {
    const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (!data) return null;

    return data.map((row: any) => ({
      id: row.id,
      customerId: row.customer_id || '',
      customerName: row.customer_name || 'عميل نقدي',
      date: row.date,
      time: row.time || '',
      employeeName: row.employee_name || '',
      items: Array.isArray(row.items) ? row.items : [],
      subtotal: Number(row.subtotal || 0),
      tax: Number(row.tax || 0),
      discount: Number(row.discount || 0),
      total: Number(row.total || 0),
      paidAmount: Number(row.paid_amount || 0),
      status: (row.status as InvoiceStatus) || InvoiceStatus.PAID,
      notes: row.notes || '',
    }));
  } catch (err) {
    console.warn('Supabase fetchInvoices failed:', err);
    return null;
  }
}

export async function fetchPurchaseOrdersFromSupabase(): Promise<PurchaseOrder[] | null> {
  try {
    const { data, error } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (!data) return null;

    return data.map((row: any) => ({
      id: row.id,
      supplierId: row.supplier_id || '',
      supplierName: row.supplier_name || '',
      date: row.date,
      status: row.status,
      total: Number(row.total || 0),
      items: Array.isArray(row.items) ? row.items : [],
    }));
  } catch (err) {
    console.warn('Supabase fetchPurchaseOrders failed:', err);
    return null;
  }
}

export async function fetchEmployeesFromSupabase(): Promise<Employee[] | null> {
  try {
    const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (!data) return null;

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      username: row.username || '',
      password: row.password || '',
      role: (row.role as EmployeeRole) || EmployeeRole.SALES,
      phone: row.phone || '',
      status: row.status || 'active',
    }));
  } catch (err) {
    console.warn('Supabase fetchEmployees failed:', err);
    return null;
  }
}

export async function fetchCategoriesFromSupabase(): Promise<string[] | null> {
  try {
    const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'categories').maybeSingle();
    if (error) throw error;
    if (!data || !Array.isArray(data.value)) return null;
    return data.value;
  } catch {
    return null;
  }
}

// 2. تحميل كافة بيانات المنظومة في نداء متوازي واحد
export async function loadAllDataFromCloud(): Promise<Partial<CloudDataBundle>> {
  const [
    products,
    customers,
    suppliers,
    invoices,
    purchaseOrders,
    employees,
    categories,
  ] = await Promise.all([
    fetchProductsFromSupabase(),
    fetchCustomersFromSupabase(),
    fetchSuppliersFromSupabase(),
    fetchInvoicesFromSupabase(),
    fetchPurchaseOrdersFromSupabase(),
    fetchEmployeesFromSupabase(),
    fetchCategoriesFromSupabase(),
  ]);

  const bundle: Partial<CloudDataBundle> = {};
  if (products !== null) bundle.products = products;
  if (customers !== null) bundle.customers = customers;
  if (suppliers !== null) bundle.suppliers = suppliers;
  if (invoices !== null) bundle.invoices = invoices;
  if (purchaseOrders !== null) bundle.purchaseOrders = purchaseOrders;
  if (employees !== null) bundle.employees = employees;
  if (categories !== null) bundle.categories = categories;

  return bundle;
}

// ===============================================================
// دوال حفظ وتعديل وحذف البيانات (Data Mutation Pipeline)
// ===============================================================

// المنتجات
export async function upsertProductToSupabase(product: Product): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').upsert({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      stock: product.stock,
      min_stock: product.minStock,
      price: product.price,
      cost: product.cost,
      specs: product.specs || '',
      track_serial: !!product.trackSerial,
      serial_numbers: product.serialNumbers || [],
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upsertProduct error:', err);
    return false;
  }
}

export async function deleteProductFromSupabase(id: string): Promise<boolean> {
  try {
    // حذف أي سجلات مرتبطة بالمنتج في جدول حركة المخزون أولاً
    try {
      await supabase.from('inventory_logs').delete().eq('product_id', id);
    } catch {
      // تجاوز في حال عدم وجود الجدول
    }

    // حذف المنتج نهائياً من قاعدة البيانات
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteProduct error:', err);
    return false;
  }
}

// العملاء
export async function upsertCustomerToSupabase(customer: Customer): Promise<boolean> {
  try {
    const { error } = await supabase.from('customers').upsert({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      type: customer.type,
      address: customer.address,
      email: customer.email || '',
      balance: customer.balance,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upsertCustomer error:', err);
    return false;
  }
}

// الموردين
export async function upsertSupplierToSupabase(supplier: Supplier): Promise<boolean> {
  try {
    const { error } = await supabase.from('suppliers').upsert({
      id: supplier.id,
      name: supplier.name,
      contact_person: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upsertSupplier error:', err);
    return false;
  }
}

// الفواتير
export async function upsertInvoiceToSupabase(invoice: Invoice): Promise<boolean> {
  try {
    // التحقق من معرف العميل لتفادي أخطاء المفتاح الخارجي في حال كان عميلاً نقدياً
    const validCustomerId = 
      invoice.customerId && 
      invoice.customerId !== 'CASH' && 
      invoice.customerId !== 'cash' && 
      !invoice.customerId.startsWith('cash-')
        ? invoice.customerId 
        : null;

    const { error } = await supabase.from('invoices').upsert({
      id: invoice.id,
      customer_id: validCustomerId,
      customer_name: invoice.customerName || 'عميل نقدي',
      date: invoice.date,
      time: invoice.time || '',
      employee_name: invoice.employeeName || '',
      items: invoice.items,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount || 0,
      total: invoice.total,
      paid_amount: invoice.paidAmount,
      status: invoice.status,
      notes: invoice.notes ? `${invoice.notes}${invoice.paymentMethod ? ` | طريقة الدفع: ${invoice.paymentMethod}` : ''}` : (invoice.paymentMethod ? `طريقة الدفع: ${invoice.paymentMethod}` : ''),
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upsertInvoice error:', err);
    return false;
  }
}

export async function deleteInvoiceFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteInvoice error:', err);
    return false;
  }
}

export async function clearAllInvoicesFromSupabase(): Promise<boolean> {
  try {
    const { error } = await supabase.from('invoices').delete().neq('id', '___NEVER_MATCH___');
    if (error) throw error;
    try {
      await supabase.from('inventory_logs').delete().eq('change_type', 'sale');
    } catch {}
    return true;
  } catch (err) {
    console.warn('Supabase clearAllInvoices error:', err);
    return false;
  }
}

// تسجيل حركة المخزون في السحابة
export async function recordInventoryLogToSupabase(log: {
  productId?: string;
  changeType: 'sale' | 'purchase' | 'adjustment';
  quantity: number;
  referenceId?: string;
  notes?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('inventory_logs').insert({
      product_id: log.productId || null,
      change_type: log.changeType,
      quantity: log.quantity,
      reference_id: log.referenceId || null,
      notes: log.notes || null,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase recordInventoryLog error:', err);
    return false;
  }
}

export async function fetchInventoryLogsFromSupabase(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('inventory_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase fetchInventoryLogs error:', err);
    return [];
  }
}

// أوامر الشراء
export async function upsertPurchaseOrderToSupabase(po: PurchaseOrder): Promise<boolean> {
  try {
    const { error } = await supabase.from('purchase_orders').upsert({
      id: po.id,
      supplier_id: po.supplierId,
      supplier_name: po.supplierName,
      date: po.date,
      status: po.status,
      total: po.total,
      items: po.items,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upsertPurchaseOrder error:', err);
    return false;
  }
}

// الموظفين
export async function upsertEmployeeToSupabase(employee: Employee): Promise<boolean> {
  try {
    const { error } = await supabase.from('employees').upsert({
      id: employee.id,
      name: employee.name,
      username: employee.username || '',
      password: employee.password || '',
      role: employee.role,
      phone: employee.phone,
      status: employee.status,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upsertEmployee error:', err);
    return false;
  }
}

export async function deleteEmployeeFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteEmployee error:', err);
    return false;
  }
}

// التصنيفات
export async function saveCategoriesToSupabase(categories: string[]): Promise<boolean> {
  try {
    const { error } = await supabase.from('app_settings').upsert({
      key: 'categories',
      value: categories,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

// ===============================================================
// تصفير ومسح كافة البيانات السحابية بالكامل
// ===============================================================
export async function wipeAllCloudData(): Promise<{ success: boolean; message: string }> {
  try {
    await supabase.from('inventory_logs').delete().neq('quantity', -999999);
    await supabase.from('invoices').delete().neq('id', '___none___');
    await supabase.from('purchase_orders').delete().neq('id', '___none___');
    await supabase.from('products').delete().neq('id', '___none___');
    await supabase.from('customers').delete().neq('id', '___none___');
    await supabase.from('suppliers').delete().neq('id', '___none___');
    return { success: true, message: 'تم تصفير ومسح كافة البيانات من السحابة بنجاح!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'حدث خطأ أثناء مسح البيانات' };
  }
}

// ===============================================================
// المزامنة الشاملة (Full Push)
// ===============================================================
export async function syncAllLocalDataToSupabase(allData: {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  employees: Employee[];
  categories: string[];
}): Promise<{ success: boolean; message: string }> {
  try {
    // 1. المنتجات
    if (allData.products.length > 0) {
      const { error } = await supabase.from('products').upsert(
        allData.products.map(p => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          stock: p.stock,
          min_stock: p.minStock,
          price: p.price,
          cost: p.cost,
          specs: p.specs || '',
          track_serial: !!p.trackSerial,
          serial_numbers: p.serialNumbers || [],
          updated_at: new Date().toISOString(),
        }))
      );
      if (error) throw new Error(`خطأ في جدول المنتجات: ${error.message}`);
    }

    // 2. العملاء
    if (allData.customers.length > 0) {
      const { error } = await supabase.from('customers').upsert(
        allData.customers.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          type: c.type,
          address: c.address,
          email: c.email || '',
          balance: c.balance,
          updated_at: new Date().toISOString(),
        }))
      );
      if (error) throw new Error(`خطأ في جدول العملاء: ${error.message}`);
    }

    // 3. الموردين
    if (allData.suppliers.length > 0) {
      const { error } = await supabase.from('suppliers').upsert(
        allData.suppliers.map(s => ({
          id: s.id,
          name: s.name,
          contact_person: s.contactPerson,
          phone: s.phone,
          email: s.email,
          address: s.address,
          updated_at: new Date().toISOString(),
        }))
      );
      if (error) throw new Error(`خطأ في جدول الموردين: ${error.message}`);
    }

    // 4. الفواتير
    if (allData.invoices.length > 0) {
      const { error } = await supabase.from('invoices').upsert(
        allData.invoices.map(inv => ({
          id: inv.id,
          customer_id: inv.customerId,
          customer_name: inv.customerName,
          date: inv.date,
          time: inv.time || '',
          employee_name: inv.employeeName || '',
          items: inv.items,
          subtotal: inv.subtotal,
          tax: inv.tax,
          discount: inv.discount,
          total: inv.total,
          paid_amount: inv.paidAmount,
          status: inv.status,
          notes: inv.notes || '',
        }))
      );
      if (error) throw new Error(`خطأ في جدول الفواتير: ${error.message}`);
    }

    // 5. أوامر الشراء
    if (allData.purchaseOrders.length > 0) {
      const { error } = await supabase.from('purchase_orders').upsert(
        allData.purchaseOrders.map(po => ({
          id: po.id,
          supplier_id: po.supplierId,
          supplier_name: po.supplierName,
          date: po.date,
          status: po.status,
          total: po.total,
          items: po.items,
        }))
      );
      if (error) throw new Error(`خطأ في أوامر الشراء: ${error.message}`);
    }

    // 6. الموظفين
    if (allData.employees.length > 0) {
      const { error } = await supabase.from('employees').upsert(
        allData.employees.map(e => ({
          id: e.id,
          name: e.name,
          username: e.username || '',
          password: e.password || '',
          role: e.role,
          phone: e.phone,
          status: e.status,
        }))
      );
      if (error) throw new Error(`خطأ في الموظفين: ${error.message}`);
    }

    // 7. التصنيفات
    if (allData.categories.length > 0) {
      await saveCategoriesToSupabase(allData.categories);
    }

    return { success: true, message: 'تمت مزامنة جميع البيانات بنجاح مع Supabase!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'فشلت المزامنة' };
  }
}
