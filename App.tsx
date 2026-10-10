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
import { initialProducts, initialInvoices, initialCustomers, initialSuppliers, initialPurchaseOrders, initialEmployees } from './data';
import { Menu, Database, RefreshCw } from './components/Icons';
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

// تنظيف وتفريغ أي معاملات بيع أو فواتير سابقة لضمان بدء النظام نظيفاً تماماً
if (typeof window !== 'undefined' && localStorage.getItem('erp_clean_invoices_wiped_v1') !== 'true') {
  localStorage.removeItem('erp_invoices');
  localStorage.setItem('erp_clean_invoices_wiped_v1', 'true');
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Global State (Local + Cloud Database) - يبدأ فارغاً تماماً
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

  // دالة تحميل وتحديث كافة البيانات من سحابة Supabase
  const loadCloudData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const status = await checkSupabaseConnection();
      setIsCloudConnected(status.connected);

      if (status.connected && status.tablesExist) {
        const bundle = await loadAllDataFromCloud();
        if (bundle.products) setProducts(bundle.products);
        if (bundle.customers) setCustomers(bundle.customers);
        if (bundle.suppliers) setSuppliers(bundle.suppliers);
        if (bundle.invoices) setInvoices(bundle.invoices);
        if (bundle.purchaseOrders) setPurchaseOrders(bundle.purchaseOrders);
        if (bundle.employees && bundle.employees.length > 0) setEmployees(bundle.employees);
        if (bundle.categories && bundle.categories.length > 0) setProductCategories(bundle.categories);
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
      alert('تم مسح وتصفير كافة البيانات بنجاح! أصبحت قاعدة البيانات فارغة تماماً.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial Supabase Cloud Load & Auth Session Check
  useEffect(() => {
    async function initSupabase() {
      // 1. استرجاع جلسة المستخدم المسجل في Supabase Auth إن وجدت
      const activeUser = await getCurrentSupabaseUser();
      if (activeUser) {
        setCurrentUser(activeUser);
      }

      // 2. تحميل البيانات السحابية
      await loadCloudData(true);
    }

    initSupabase();

    // الاستماع لتغيرات حالة المصادقة (Auth State Change)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = await getCurrentSupabaseUser();
        if (user) setCurrentUser(user);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!currentUser) {
    return <Auth employees={employees} setEmployees={setEmployees} onLogin={setCurrentUser} />;
  }


  const handleAddProduct = (newProduct: Product) => {
    setProducts([newProduct, ...products]);
    upsertProductToSupabase(newProduct).catch(() => {});
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    // 1. تحديث الحالة المحلية وتخزين المتصفح
    const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updated);
    try {
      localStorage.setItem('erp_products', JSON.stringify(updated));
    } catch {}

    // 2. تحديث المنتج في قاعدة البيانات السحابية (Supabase)
    await upsertProductToSupabase(updatedProduct);
  };

  const handleDeleteProduct = async (productId: string) => {
    // 1. حذف من الحالة المحلية وتخزين الجهاز
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    try {
      localStorage.setItem('erp_products', JSON.stringify(updated));
    } catch {}

    // 2. حذف المنتج وما يتعلق به من قاعدة البيانات السحابية (Supabase)
    await deleteProductFromSupabase(productId);
  };

  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers([newCustomer, ...customers]);
    upsertCustomerToSupabase(newCustomer).catch(() => {});
  };

  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers([newSupplier, ...suppliers]);
    upsertSupplierToSupabase(newSupplier).catch(() => {});
  };

  const handleSaveInvoice = (newInvoice: Invoice) => {
    setInvoices([newInvoice, ...invoices]);
    upsertInvoiceToSupabase(newInvoice).catch(() => {});

    // 1. خصم الكميات من المخزون والأرقام التسلسلية المباعة بدقة
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

        // تحديث المنتج سحابياً في Supabase
        upsertProductToSupabase(updated).catch(() => {});

        // 2. تسجيل حركة المخزون في السحابة
        recordInventoryLogToSupabase({
          productId: product.id,
          changeType: 'sale',
          quantity: -totalQuantitySold,
          referenceId: newInvoice.id,
          notes: `مبيعات كاشير فاتورة ${newInvoice.id} للعميل: ${newInvoice.customerName} (${totalQuantitySold} وحدة)`
        }).catch(() => {});

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
          upsertCustomerToSupabase(updated).catch(() => {});
          return updated;
        }
        return c;
      });
      setCustomers(updatedCustomers);
    }
  };

  const handleSavePurchaseOrder = (newOrder: PurchaseOrder) => {
    setPurchaseOrders([newOrder, ...purchaseOrders]);
    upsertPurchaseOrderToSupabase(newOrder).catch(() => {});
  };

  const handleReceiveOrder = (orderId: string) => {
    const orderIndex = purchaseOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    
    const order = purchaseOrders[orderIndex];
    // Only process if currently ordered
    if (order.status !== 'ordered') return;

    // 1. Update Products Stock
    const updatedProducts = products.map(product => {
      const orderItem = order.items.find(item => item.productId === product.id);
      if (orderItem) {
        const updated = { ...product, stock: product.stock + orderItem.quantity };
        upsertProductToSupabase(updated).catch(() => {});
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
    upsertPurchaseOrderToSupabase(updatedOrder).catch(() => {});
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
        return <Invoices 
          invoices={invoices} 
          onDeleteInvoice={handleDeleteInvoice} 
          onClearAllInvoices={handleClearAllInvoices} 
        />;
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

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto min-h-full">
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap justify-between items-center gap-4 border border-gray-100">
              <div className="flex items-center gap-4">
                <img src="/Logo.png" alt="ابن السنوسي" className="w-16 h-16 object-contain hidden sm:block" />
                <div>
                  <h1 className="text-xl font-bold text-gray-800">مرحباً بك، {currentUser.name} 👋</h1>
                  <p className="text-sm text-gray-500">نتمنى لك يوماً سعيداً وموفقاً في العمل</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Manual Cloud Refresh Button */}
                <button
                  onClick={() => loadCloudData(false)}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all border border-gray-200 disabled:opacity-50"
                  title="تحديث البيانات من سحابة Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-blue' : ''}`} />
                  <span className="hidden sm:inline">{isRefreshing ? 'جاري الجلب...' : 'تحديث السحابة'}</span>
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