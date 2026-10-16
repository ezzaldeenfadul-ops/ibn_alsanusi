import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Purchases from './pages/Purchases';
import Employees from './pages/Employees';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Auth from './pages/Auth';
import { ViewState, Invoice, Product, Customer, Supplier, PurchaseOrder, Employee } from './types';
import { Menu, Database, RefreshCw, X, CheckCircle2, AlertTriangle } from './components/Icons';
import { 
  checkSupabaseConnection, 
  loadAllDataFromCloud,
  wipeAllCloudData,
  upsertProductToSupabase,
  deleteProductFromSupabase,
  upsertCustomerToSupabase,
  upsertSupplierToSupabase,
  upsertInvoiceToSupabase,
  deleteInvoiceFromSupabase,
  clearAllInvoicesFromSupabase,
  upsertPurchaseOrderToSupabase,
  recordInventoryLogToSupabase
} from './supabaseService';
import { supabase, SUPABASE_PROJECT_NAME } from './supabase';
import { getCurrentSupabaseUser, signOutFromSupabase } from './authService';
import { 
  getPendingSyncQueue, 
  enqueuePendingSync, 
  processPendingSyncQueue 
} from './syncService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getPendingSyncQueue().length);
  const [globalToast, setGlobalToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);
  
  // Global State (Local + Cloud Database)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('erp_products');
    return saved ? JSON.parse(saved) : [];
  });
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('erp_invoices');
    return saved ? JSON.parse(saved) : [];
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('erp_customers');
    return saved ? JSON.parse(saved) : [];
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('erp_suppliers');
    return saved ? JSON.parse(saved) : [];
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('erp_purchase_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('erp_employees_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [productCategories, setProductCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('erp_product_categories');
    return saved ? JSON.parse(saved) : ['ألوح شمسية', 'محول (Inverter)', 'بطارية', 'كابلات', 'هياكل تثبيت', 'اكسسوارات', 'خدمة / تركيب'];
  });

  // Sync to localStorage as offline mirror
  useEffect(() => { localStorage.setItem('erp_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('erp_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('erp_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('erp_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('erp_purchase_orders', JSON.stringify(purchaseOrders)); }, [purchaseOrders]);
  useEffect(() => { localStorage.setItem('erp_employees_v2', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('erp_product_categories', JSON.stringify(productCategories)); }, [productCategories]);

  // إخفاء إشعار النظام تلقائياً بعد 6 ثوانٍ
  useEffect(() => {
    if (globalToast) {
      const timer = setTimeout(() => setGlobalToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [globalToast]);

  // دالة تحميل وتحديث كافة البيانات من سحابة Supabase مع الدمج الذكي (Smart Merge)
  const loadCloudData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const status = await checkSupabaseConnection();
      setIsCloudConnected(status.connected);

      if (status.connected && status.tablesExist) {
        const bundle = await loadAllDataFromCloud();

        // 1. دمج المنتجات بذكاء لمنع مسح المنتجات المحلية غير المرفوعة
        if (bundle.products) {
          setProducts(prevProducts => {
            const cloudMap = new Map(bundle.products!.map(p => [p.id, p]));
            const localUnsynced = prevProducts.filter(p => !cloudMap.has(p.id));
            if (localUnsynced.length > 0) {
              localUnsynced.forEach(p => enqueuePendingSync('product', p));
            }
            return [...bundle.products!, ...localUnsynced];
          });
        }

        // 2. دمج الفواتير بذكاء لمنع مسح الفواتير المحلية التي تمت دون اتصال
        if (bundle.invoices) {
          setInvoices(prevInvoices => {
            const cloudMap = new Map(bundle.invoices!.map(i => [i.id, i]));
            const localUnsynced = prevInvoices.filter(i => !cloudMap.has(i.id));
            if (localUnsynced.length > 0) {
              localUnsynced.forEach(inv => enqueuePendingSync('invoice', inv));
            }
            return [...bundle.invoices!, ...localUnsynced];
          });
        }

        // 3. دمج العملاء
        if (bundle.customers) {
          setCustomers(prevCustomers => {
            const cloudMap = new Map(bundle.customers!.map(c => [c.id, c]));
            const localUnsynced = prevCustomers.filter(c => !cloudMap.has(c.id));
            if (localUnsynced.length > 0) {
              localUnsynced.forEach(c => enqueuePendingSync('customer', c));
            }
            return [...bundle.customers!, ...localUnsynced];
          });
        }

        // 4. دمج الموردين
        if (bundle.suppliers) {
          setSuppliers(prevSuppliers => {
            const cloudMap = new Map(bundle.suppliers!.map(s => [s.id, s]));
            const localUnsynced = prevSuppliers.filter(s => !cloudMap.has(s.id));
            if (localUnsynced.length > 0) {
              localUnsynced.forEach(s => enqueuePendingSync('supplier', s));
            }
            return [...bundle.suppliers!, ...localUnsynced];
          });
        }

        // 5. دمج طلبات الشراء
        if (bundle.purchaseOrders) {
          setPurchaseOrders(prevOrders => {
            const cloudMap = new Map(bundle.purchaseOrders!.map(o => [o.id, o]));
            const localUnsynced = prevOrders.filter(o => !cloudMap.has(o.id));
            if (localUnsynced.length > 0) {
              localUnsynced.forEach(o => enqueuePendingSync('purchase_order', o));
            }
            return [...bundle.purchaseOrders!, ...localUnsynced];
          });
        }

        if (bundle.employees && bundle.employees.length > 0) setEmployees(bundle.employees);
        if (bundle.categories && bundle.categories.length > 0) setProductCategories(bundle.categories);

        // تشغيل طابور المزامنة التلقائية المعلقة
        const syncRes = await processPendingSyncQueue();
        const remainingQueue = getPendingSyncQueue();
        setPendingSyncCount(remainingQueue.length);
        if (syncRes.succeeded > 0) {
          setGlobalToast({
            type: 'success',
            message: `🔄 تم رفع ومزامنة ${syncRes.succeeded} عملية معلقة سحابياً بنجاح!`
          });
        }
      }
    } catch (err) {
      console.warn('Cloud fetch notice:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  const handleWipeAllData = async () => {
    if (!window.confirm('تحذير: هل أنت متأكد من مسح وتصفير كافة البيانات من السحابة والجهاز نهائياً؟')) {
      return;
    }
    setIsRefreshing(true);
    try {
      await wipeAllCloudData();
      setProducts([]);
      setInvoices([]);
      setCustomers([]);
      setSuppliers([]);
      setPurchaseOrders([]);
      localStorage.removeItem('erp_products');
      localStorage.removeItem('erp_invoices');
      localStorage.removeItem('erp_customers');
      localStorage.removeItem('erp_suppliers');
      localStorage.removeItem('erp_purchase_orders');
      localStorage.removeItem('erp_offline_sync_queue_v1');
      setPendingSyncCount(0);
      alert('تم مسح وتصفير كافة البيانات بنجاح! أصبحت قاعدة البيانات فارغة تماماً.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial Supabase Cloud Load & Auth Session Check & Periodic Auto-Sync
  useEffect(() => {
    async function initSupabase() {
      const activeUser = await getCurrentSupabaseUser();
      if (activeUser) {
        setCurrentUser(activeUser);
      }
      await loadCloudData(true);
    }

    initSupabase();

    // الاستماع لتغيرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = await getCurrentSupabaseUser();
        if (user) setCurrentUser(user);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    // مراقبة عودة الاتصال ومزامنة العمليات المعلقة تلقائياً
    const handleOnline = () => {
      setIsCloudConnected(true);
      processPendingSyncQueue().then(res => {
        setPendingSyncCount(getPendingSyncQueue().length);
        if (res.succeeded > 0) {
          setGlobalToast({
            type: 'success',
            message: `🌐 تم استعادة الاتصال ومزامنة ${res.succeeded} عملية معلقة سحابياً بنجاح!`
          });
        }
      });
    };

    const handleOffline = () => {
      setIsCloudConnected(false);
      setGlobalToast({
        type: 'warning',
        message: '⚠️ انقطع الاتصال بالإنترنت. النظام يعمل محلياً بالكامل وسيتم حفظ العمليات في طابور المزامنة التلقائية.'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // جدولة مزامنة دورية كل 30 ثانية
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        processPendingSyncQueue().then(() => {
          setPendingSyncCount(getPendingSyncQueue().length);
        });
      }
    }, 30000);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  if (!currentUser) {
    return <Auth employees={employees} setEmployees={setEmployees} onLogin={setCurrentUser} />;
  }

  // معالجات البيانات الموثوقة مع الحفظ السحابي وطابور المزامنة
  const handleAddProduct = async (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    const success = await upsertProductToSupabase(newProduct);
    if (!success) {
      enqueuePendingSync('product', newProduct);
      setPendingSyncCount(getPendingSyncQueue().length);
      setGlobalToast({
        type: 'warning',
        message: `⚠️ تم حفظ الصنف "${newProduct.name}" محلياً، وجدولته في طابور المزامنة السحابية.`
      });
    } else {
      setGlobalToast({
        type: 'success',
        message: `✅ تم حفظ الصنف "${newProduct.name}" بنجاح في قاعدة البيانات السحابية.`
      });
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updated);
    try {
      localStorage.setItem('erp_products', JSON.stringify(updated));
    } catch {}

    const success = await upsertProductToSupabase(updatedProduct);
    if (!success) {
      enqueuePendingSync('product', updatedProduct);
      setPendingSyncCount(getPendingSyncQueue().length);
      setGlobalToast({
        type: 'warning',
        message: `⚠️ تم تعديل الصنف محلياً، وجدولته للمزامنة السحابية فور توفر الاتصال.`
      });
    } else {
      setGlobalToast({
        type: 'success',
        message: `✅ تم تحديث الصنف "${updatedProduct.name}" في قاعدة البيانات السحابية بنجاح.`
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    try {
      localStorage.setItem('erp_products', JSON.stringify(updated));
    } catch {}
    await deleteProductFromSupabase(productId);
  };

  const handleAddCustomer = async (newCustomer: Customer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    const success = await upsertCustomerToSupabase(newCustomer);
    if (!success) {
      enqueuePendingSync('customer', newCustomer);
      setPendingSyncCount(getPendingSyncQueue().length);
    }
  };

  const handleAddSupplier = async (newSupplier: Supplier) => {
    setSuppliers(prev => [newSupplier, ...prev]);
    const success = await upsertSupplierToSupabase(newSupplier);
    if (!success) {
      enqueuePendingSync('supplier', newSupplier);
      setPendingSyncCount(getPendingSyncQueue().length);
    }
  };

  const handleSaveInvoice = async (newInvoice: Invoice) => {
    setInvoices(prev => [newInvoice, ...prev]);

    // 1. حفظ الفاتورة سحابياً
    const success = await upsertInvoiceToSupabase(newInvoice);
    if (!success) {
      enqueuePendingSync('invoice', newInvoice);
      setPendingSyncCount(getPendingSyncQueue().length);
      setGlobalToast({
        type: 'warning',
        message: `⚠️ تم تسجيل الفاتورة #${newInvoice.id} محلياً وجدولتها للمزامنة السحابية فور توفر الاتصال.`
      });
    } else {
      setGlobalToast({
        type: 'success',
        message: `✅ تم حفظ الفاتورة #${newInvoice.id} بنجاح في قاعدة البيانات السحابية ومزامنة المخزن.`
      });
    }

    // 2. خصم الكميات من المخزون والأرقام التسلسلية بدقة
    const updatedProducts = products.map(product => {
      const soldItems = newInvoice.items.filter(item => item.productId === product.id);
      if (soldItems.length > 0) {
        const totalQuantitySold = soldItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        const allSoldSerials = soldItems.flatMap(item => item.serialNumbers || []);
        
        const remainingSerials = product.serialNumbers 
          ? product.serialNumbers.filter(sn => !allSoldSerials.includes(sn))
          : [];

        const newStock = Math.max(0, product.stock - totalQuantitySold);
        const updated = { 
          ...product, 
          stock: newStock,
          serialNumbers: remainingSerials
        };

        upsertProductToSupabase(updated).then(prodSuccess => {
          if (!prodSuccess) enqueuePendingSync('product', updated);
        });

        recordInventoryLogToSupabase({
          productId: product.id,
          changeType: 'sale',
          quantity: -totalQuantitySold,
          referenceId: newInvoice.id,
          notes: `مبيعات كاشير فاتورة ${newInvoice.id} للعميل: ${newInvoice.customerName} (${totalQuantitySold} وحدة)`
        }).then(logSuccess => {
          if (!logSuccess) {
            enqueuePendingSync('inventory_log', {
              productId: product.id,
              changeType: 'sale',
              quantity: -totalQuantitySold,
              referenceId: newInvoice.id,
              notes: `مبيعات كاشير فاتورة ${newInvoice.id}`
            });
          }
        });

        return updated;
      }
      return product;
    });
    setProducts(updatedProducts);

    // 3. تحديث مديونية العميل في حال كانت الفاتورة آجلة أو مدفوعة جزئياً
    const unpaidAmount = Number(newInvoice.total || 0) - Number(newInvoice.paidAmount || 0);
    if (unpaidAmount > 0 && newInvoice.customerId && newInvoice.customerId !== 'CASH') {
      const updatedCustomers = customers.map(c => {
        if (c.id === newInvoice.customerId) {
          const updated = { ...c, balance: Number(c.balance || 0) + unpaidAmount };
          upsertCustomerToSupabase(updated).then(custSuccess => {
            if (!custSuccess) enqueuePendingSync('customer', updated);
          });
          return updated;
        }
        return c;
      });
      setCustomers(updatedCustomers);
    }
  };

  const handleSavePurchaseOrder = async (newOrder: PurchaseOrder) => {
    setPurchaseOrders(prev => [newOrder, ...prev]);
    const success = await upsertPurchaseOrderToSupabase(newOrder);
    if (!success) {
      enqueuePendingSync('purchase_order', newOrder);
      setPendingSyncCount(getPendingSyncQueue().length);
    }
  };

  const handleReceiveOrder = async (orderId: string) => {
    const orderIndex = purchaseOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    
    const order = purchaseOrders[orderIndex];
    if (order.status !== 'ordered') return;

    // 1. Update Products Stock
    const updatedProducts = products.map(product => {
      const orderItem = order.items.find(item => item.productId === product.id);
      if (orderItem) {
        const updated = { ...product, stock: product.stock + orderItem.quantity };
        upsertProductToSupabase(updated).then(s => {
          if (!s) enqueuePendingSync('product', updated);
        });
        return updated;
      }
      return product;
    });
    setProducts(updatedProducts);

    // 2. Update Order Status
    const updatedOrders = [...purchaseOrders];
    const updatedOrder = { ...order, status: 'received' as const };
    updatedOrders[orderIndex] = updatedOrder;
    setPurchaseOrders(updatedOrders);
    
    const poSuccess = await upsertPurchaseOrderToSupabase(updatedOrder);
    if (!poSuccess) {
      enqueuePendingSync('purchase_order', updatedOrder);
      setPendingSyncCount(getPendingSyncQueue().length);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const updated = invoices.filter(i => i.id !== invoiceId);
    setInvoices(updated);
    try {
      localStorage.setItem('erp_invoices', JSON.stringify(updated));
    } catch {}
    await deleteInvoiceFromSupabase(invoiceId);
  };

  const handleClearAllInvoices = async () => {
    setInvoices([]);
    try {
      localStorage.removeItem('erp_invoices');
    } catch {}
    await clearAllInvoicesFromSupabase();
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard products={products} invoices={invoices} customers={customers} />;
      case 'inventory':
        return (
          <Inventory 
            products={products} 
            categories={productCategories} 
            onAddProduct={handleAddProduct} 
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct} 
          />
        );
      case 'pos':
        return <POS products={products} customers={customers} onSaveInvoice={handleSaveInvoice} onNavigateToInvoices={() => setCurrentView('invoices')} currentUser={currentUser} />;
      case 'invoices':
        return (
          <Invoices 
            invoices={invoices} 
            onDeleteInvoice={handleDeleteInvoice} 
            onClearAllInvoices={handleClearAllInvoices} 
          />
        );
      case 'customers':
        return <Customers customers={customers} onAddCustomer={handleAddCustomer} />;
      case 'purchases':
        return <Purchases 
          suppliers={suppliers} 
          orders={purchaseOrders} 
          products={products}
          onReceiveOrder={handleReceiveOrder} 
          onSaveOrder={handleSavePurchaseOrder}
          onAddSupplier={handleAddSupplier}
        />;
      case 'employees':
        return <Employees employees={employees} />;
      case 'reports':
        return <Reports 
          invoices={invoices} 
          products={products} 
          employees={employees} 
          customers={customers} 
        />;
      case 'settings':
        return <Settings
            employees={employees}
            setEmployees={setEmployees}
            productCategories={productCategories}
            setProductCategories={setProductCategories}
            products={products}
            setProducts={setProducts}
            customers={customers}
            setCustomers={setCustomers}
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            invoices={invoices}
            setInvoices={setInvoices}
            purchaseOrders={purchaseOrders}
            setPurchaseOrders={setPurchaseOrders}
            currentUser={currentUser}
            onWipeAllData={handleWipeAllData}
        />;
      default:
        return <div className="p-10 text-center text-gray-500">جاري العمل على هذه الصفحة...</div>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        currentUser={currentUser}
        onLogout={async () => {
          await signOutFromSupabase();
          setCurrentUser(null);
        }}
      />
      
      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full relative w-full overflow-hidden transition-all duration-300">
        
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-30">
          <div className="font-bold text-lg text-brand-blue flex items-center gap-2">
            <span className="w-2 h-8 bg-brand-yellow rounded-full"></span>
            ابن السنوسي
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Global Floating Toast / Alert */}
        {globalToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] animate-fade-in shadow-2xl">
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              globalToast.type === 'success' 
                ? 'bg-emerald-900 text-white border-emerald-700' 
                : globalToast.type === 'warning'
                ? 'bg-amber-900 text-amber-100 border-amber-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
                {globalToast.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <span>{globalToast.message}</span>
              </div>
              <button 
                onClick={() => setGlobalToast(null)} 
                className="text-white/60 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto min-h-full">
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap justify-between items-center gap-4 border border-gray-100">
              <div className="flex items-center gap-4">
                <img src="/Logo.png" alt="ابن السنوسي" className="w-16 h-16 object-contain hidden sm:block" />
                <div>
                  <h1 className="text-xl font-bold text-gray-800">مرحباً بك، {currentUser.name} 👋</h1>
                  <p className="text-sm text-gray-500">نظام إدارة وتخطيط موارد المؤسسة المتكامل</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Pending Offline Sync Badge */}
                {pendingSyncCount > 0 && (
                  <div 
                    onClick={() => loadCloudData(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold cursor-pointer hover:bg-amber-100 transition-all shadow-sm"
                    title="هناك عمليات بانتظار المزامنة السحابية - اضغط للمزامنة فوراً"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    <span>معلق: {pendingSyncCount}</span>
                  </div>
                )}

                {/* Manual Cloud Refresh Button */}
                <button
                  onClick={() => loadCloudData(false)}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all border border-gray-200 disabled:opacity-50 cursor-pointer"
                  title="مزامنة وتحديث البيانات مع سحابة Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-blue' : ''}`} />
                  <span className="hidden sm:inline">{isRefreshing ? 'جاري المزامنة...' : 'مزامنة السحابة'}</span>
                </button>

                {/* Supabase Status Button */}
                <div 
                  onClick={() => setCurrentView('settings')}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-100 cursor-pointer transition-all shadow-sm"
                  title="اضغط للانتقال لإعدادات ومزامنة Supabase"
                >
                  <Database className="w-4 h-4 text-brand-blue" />
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-brand-blue">قاعدة البيانات</span>
                      <span className="text-[10px] text-gray-400 font-mono">({SUPABASE_PROJECT_NAME})</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                      <span>{isCloudConnected ? 'Supabase متصل' : 'سحابي (إعداد)'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;