import React, { useState, useEffect } from 'react';
import { Invoice, Product, Customer, InvoiceItem, InvoiceStatus, Employee } from '../types';
import { 
  ShoppingCart, FileText, Plus, Trash, Printer, CheckCircle2, 
  Clock, Calendar, User, DollarSign, ArrowRight, Package
} from '../components/Icons';
import OfficialInvoiceModal from '../components/OfficialInvoiceModal';
import { tafqeet } from '../utils/tafqeet';

interface POSProps {
  products: Product[];
  customers: Customer[];
  onSaveInvoice: (invoice: Invoice) => void;
  onNavigateToInvoices: () => void;
  currentUser: Employee;
}

// Active screen view: mode selector OR dedicated form
type ScreenView = 'mode-selection' | 'sale' | 'proforma';

// Single product line in the vertical form
interface FormItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  stock: number;
}

const POS: React.FC<POSProps> = ({ 
  products, 
  customers, 
  onSaveInvoice, 
  onNavigateToInvoices, 
  currentUser 
}) => {
  // 1. Current screen: 'mode-selection' (شاشة الخيارين) or 'sale' or 'proforma'
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('mode-selection');

  // Sudan Time & Date (Africa/Khartoum, GMT+2)
  const [sudanDate, setSudanDate] = useState<string>('');
  const [sudanTime, setSudanTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      try {
        const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Khartoum' }); // YYYY-MM-DD
        const timeStr = now.toLocaleTimeString('ar-SD', { 
          timeZone: 'Africa/Khartoum', 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit',
          hour12: true 
        });
        setSudanDate(dateStr);
        setSudanTime(timeStr);
      } catch {
        setSudanDate(now.toISOString().split('T')[0]);
        setSudanTime(now.toLocaleTimeString('ar-SA'));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Form Fields State
  const [customerName, setCustomerName] = useState<string>('عميل نقدي');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'نقداً' | 'بنكك / تحويل بنكي' | 'بطاقة مصرفية' | 'آجل'>('نقداً');
  
  // Dynamic Product Items in the Vertical Form
  const [formItems, setFormItems] = useState<FormItem[]>([
    {
      id: `item-${Date.now()}-1`,
      productId: '',
      productName: '',
      quantity: 1,
      price: 0,
      stock: 0
    }
  ]);

  // Modal State
  const [modalInvoice, setModalInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isModalProforma, setIsModalProforma] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Reset form when opening a mode
  const handleOpenMode = (mode: 'sale' | 'proforma') => {
    setCurrentScreen(mode);
    setSuccessBanner(null);
    setCustomerName(mode === 'sale' ? 'عميل نقدي' : 'عميل استفسار / عرض أسعار');
    setSelectedCustomerId('');
    setPaymentMethod('نقداً');
    // Start with 1 clean item row
    setFormItems([
      {
        id: `item-${Date.now()}-1`,
        productId: '',
        productName: '',
        quantity: 1,
        price: 0,
        stock: 0
      }
    ]);
  };

  // Add Another Product Row
  const handleAddAnotherProduct = () => {
    setFormItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        productId: '',
        productName: '',
        quantity: 1,
        price: 0,
        stock: 0
      }
    ]);
  };

  // Remove a Product Row
  const handleRemoveItem = (id: string) => {
    if (formItems.length === 1) {
      // Just clear it
      setFormItems([{
        id: `item-${Date.now()}-1`,
        productId: '',
        productName: '',
        quantity: 1,
        price: 0,
        stock: 0
      }]);
      return;
    }
    setFormItems(prev => prev.filter(item => item.id !== id));
  };

  // On Product Select Change
  const handleProductSelect = (rowId: string, selectedProdId: string) => {
    const product = products.find(p => p.id === selectedProdId);
    if (!product) return;

    setFormItems(prev => prev.map(item => {
      if (item.id !== rowId) return item;
      return {
        ...item,
        productId: product.id,
        productName: product.name,
        price: Number(product.price) || 0,
        stock: Number(product.stock) || 0,
        quantity: item.quantity > 0 ? item.quantity : 1
      };
    }));
  };

  // On Quantity Change
  const handleQuantityChange = (rowId: string, newQtyRaw: string | number) => {
    const qty = typeof newQtyRaw === 'string' ? (newQtyRaw === '' ? 0 : parseInt(newQtyRaw, 10)) : newQtyRaw;
    if (isNaN(qty) || qty < 0) return;

    setFormItems(prev => prev.map(item => {
      if (item.id !== rowId) return item;

      // In sale mode, warn if exceeds stock
      if (currentScreen === 'sale' && item.productId && qty > item.stock) {
        alert(`تنبيه: الكمية المطلوبة (${qty}) تتجاوز المتوفر بالمخزن (${item.stock} فقط) للمنتج: ${item.productName}`);
      }

      return {
        ...item,
        quantity: qty
      };
    }));
  };

  // On Custom Price Change
  const handlePriceChange = (rowId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setFormItems(prev => prev.map(item => {
      if (item.id !== rowId) return item;
      return { ...item, price: newPrice };
    }));
  };

  // Calculate Subtotal & Total dynamically
  const validItems = formItems.filter(item => item.productId && item.quantity > 0);
  const totalAmount = validItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const totalQuantityUnits = validItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalTafqeet = tafqeet(totalAmount, 'جنيه');

  // Submit Process: Complete Sale OR Generate Proforma
  const handleSubmitForm = () => {
    if (validItems.length === 0) {
      alert('يرجى اختيار منتج واحد على الأقل وتحديد كميته قبل المتابعة.');
      return;
    }

    if (currentScreen === 'sale') {
      // Check stock sufficiency in sale mode
      for (const item of validItems) {
        if (item.quantity > item.stock) {
          alert(`خطأ: الكمية المطلوبة للمنتج (${item.productName}) هي ${item.quantity} بينما المتوفر في المخزن هو ${item.stock} فقط! يرجى تعديل الكمية.`);
          return;
        }
      }
    }

    const currentCustomer = customers.find(c => c.id === selectedCustomerId);
    const finalCustomerName = currentCustomer ? currentCustomer.name : (customerName.trim() || 'عميل نقدي');
    const finalCustomerId = currentCustomer ? currentCustomer.id : 'CASH';

    // Map to Invoice Items
    const invoiceItems: InvoiceItem[] = validItems.map(item => ({
      id: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price,
      serialNumbers: []
    }));

    const isSale = currentScreen === 'sale';

    const generatedInvoice: Invoice = {
      id: isSale ? `INV-${Date.now().toString().slice(-6)}` : `QUO-${Date.now().toString().slice(-6)}`,
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      date: sudanDate,
      time: sudanTime,
      employeeName: currentUser?.name || 'مسؤول الكاشير',
      items: invoiceItems,
      subtotal: totalAmount,
      tax: 0,
      discount: 0,
      total: totalAmount,
      paidAmount: totalAmount,
      status: isSale ? InvoiceStatus.PAID : ('مبدئية' as any),
      paymentMethod: isSale ? paymentMethod : 'عرض أسعار مبدئي',
      notes: isSale 
        ? `عملية بيع كاشير معتمدة - ${finalCustomerName}`
        : 'فاتورة مبدئية غير ملزمة صالحة لمدة 7 أيام - لم تسجل كعملية بيع'
    };

    if (isSale) {
      // 🛒 خيار البيع:
      // يتم البيع وحفظ العملية ضمن المبيعات وخصم المخزون
      onSaveInvoice(generatedInvoice);

      setModalInvoice(generatedInvoice);
      setIsModalProforma(false);
      setIsModalOpen(true);
      setSuccessBanner(`تم إكمال البيع بنجاح برقم الفاتورة #${generatedInvoice.id} وحفظها في المبيعات وخصم ${totalQuantityUnits} قطعة من المخزن!`);

      // Reset form
      setFormItems([{
        id: `item-${Date.now()}-1`,
        productId: '',
        productName: '',
        quantity: 1,
        price: 0,
        stock: 0
      }]);
    } else {
      // 📄 خيار فاتورة مبدئية:
      // يتم صدور الفاتورة بدون حفظ عملية البيع وبدون خصم من المخزون
      setModalInvoice(generatedInvoice);
      setIsModalProforma(true);
      setIsModalOpen(true);
      setSuccessBanner(`تم إصدار الفاتورة المبدئية #${generatedInvoice.id} بنجاح للطباعة دون حفظها في المبيعات وبدون خصم من المخزن.`);
    }
  };

  // Convert Proforma to Final Sale
  const handleConvertToFinalSale = (proformaInvoice: Invoice) => {
    const finalSaleInvoice: Invoice = {
      ...proformaInvoice,
      id: `INV-${Date.now().toString().slice(-6)}`,
      status: InvoiceStatus.PAID,
      paymentMethod: 'نقداً',
      notes: 'تم تحويلها من فاتورة مبدئية إلى بيع نهائي معتمد'
    };
    onSaveInvoice(finalSaleInvoice);
    setModalInvoice(finalSaleInvoice);
    setIsModalProforma(false);
    setSuccessBanner(`تم تحويل الفاتورة المبدئية بنجاح إلى بيع نهائي #${finalSaleInvoice.id} وحفظها في سجل المبيعات!`);
  };

  // =========================================================================
  // VIEW 1: شاشة واجهة الكاشير الرئيسية (بها خياران فقط: بيع أو فاتورة مبدئية)
  // =========================================================================
  if (currentScreen === 'mode-selection') {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center p-4 sm:p-8 bg-slate-50 animate-fade-in">
        
        {/* Header / Info */}
        <div className="text-center max-w-xl mb-8">
          <div className="w-20 h-20 mx-auto mb-4 p-2 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center">
            <img src="/Logo.png" alt="ابن السنوسي" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            نظام الكاشير - ابن السنوسي
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            اختر نوع العملية المطلوبة للمتابعة
          </p>

          {/* Time & Employee Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <Clock className="w-4 h-4 text-brand-blue" />
              <span>توقيت السودان: <strong className="font-mono text-slate-800">{sudanTime || '--:--'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <Calendar className="w-4 h-4 text-brand-blue" />
              <span className="font-mono">{sudanDate}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <User className="w-4 h-4 text-emerald-600" />
              <span>الموظف: <strong className="text-slate-800">{currentUser?.name || 'كاشير الفرع'}</strong></span>
            </div>
          </div>
        </div>

        {/* Success Banner if returned from an operation */}
        {successBanner && (
          <div className="w-full max-w-2xl mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold text-center animate-fade-in shadow-sm">
            ✅ {successBanner}
          </div>
        )}

        {/* THE ONLY TWO CARDS / OPTIONS (خياران فقط) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          
          {/* OPTION 1: خيار بيع (Sale) */}
          <div 
            onClick={() => handleOpenMode('sale')}
            className="group relative bg-white hover:bg-gradient-to-b hover:from-white hover:to-emerald-50/40 p-8 rounded-3xl border-2 border-slate-200 hover:border-emerald-500 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between text-right transform hover:-translate-y-1"
          >
            <div className="absolute top-5 left-5 w-3 h-3 rounded-full bg-emerald-500 group-hover:animate-ping"></div>

            <div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 block mb-1">
                الخيار الأول
              </span>
              <h2 className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                خيار بيع
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-3 leading-relaxed">
                تسجيل وإكمال عملية بيع نهائية، يتم فيها إصدار فاتورة معتمدة، وحفظ العملية ضمن المبيعات، وخصم الكميات تلقائياً من المخزون.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-emerald-700 font-bold text-sm">
              <span>بدء عملية البيع</span>
              <span className="text-xl group-hover:translate-x-[-6px] transition-transform">←</span>
            </div>
          </div>

          {/* OPTION 2: خيار فاتورة مبدئية (Proforma) */}
          <div 
            onClick={() => handleOpenMode('proforma')}
            className="group relative bg-white hover:bg-gradient-to-b hover:from-white hover:to-amber-50/40 p-8 rounded-3xl border-2 border-slate-200 hover:border-amber-500 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between text-right transform hover:-translate-y-1"
          >
            <div className="absolute top-5 left-5 w-3 h-3 rounded-full bg-amber-500 group-hover:animate-ping"></div>

            <div>
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                <FileText className="w-8 h-8" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 block mb-1">
                الخيار الثاني
              </span>
              <h2 className="text-2xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                خيار فاتورة مبدئية
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-3 leading-relaxed">
                إصدار فاتورة مبدئية وعرض أسعار ومواصفات للعميل للطباعة والمعاينة <strong>بدون حفظ عملية البيع</strong> وبدون أي خصم من المخزون.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-amber-700 font-bold text-sm">
              <span>بدء الفاتورة المبدئية</span>
              <span className="text-xl group-hover:translate-x-[-6px] transition-transform">←</span>
            </div>
          </div>
        </div>

        {/* Bottom Link to Invoices */}
        <div className="mt-10">
          <button
            onClick={onNavigateToInvoices}
            className="text-xs font-bold text-slate-500 hover:text-brand-blue flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>عرض سجل الفواتير والمبيعات السابقة</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: صفحة الحقول العمودية (للبيع أو الفاتورة المبدئية)
  // =========================================================================
  const isSaleMode = currentScreen === 'sale';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-slate-50 min-h-[calc(100vh-4rem)] animate-fade-in pb-16">
      
      {/* Top Navigation Bar: Back Button & Mode Indicator */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <button
          onClick={() => setCurrentScreen('mode-selection')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all"
        >
          <span>→</span>
          <span>الرجوع لخيارات الكاشير</span>
        </button>

        <div className="text-center sm:text-left flex items-center gap-3">
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-black text-white ${
              isSaleMode ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              {isSaleMode ? '🛒 نموذج عملية البيع' : '📄 نموذج الفاتورة المبدئية (عرض سعر)'}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isSaleMode ? 'سيتم حفظ البيع وخصم المخزون' : 'لن يتم حفظ العملية في المبيعات أو المخزن'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Vertical Card Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Card Header */}
        <div className={`p-6 border-b text-white ${
          isSaleMode 
            ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800' 
            : 'bg-gradient-to-r from-amber-800 via-amber-700 to-orange-800'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black">
                {isSaleMode ? 'تسجيل وإكمال عملية بيع' : 'إصدار فاتورة مبدئية / عرض أسعار'}
              </h2>
              <p className="text-xs text-white/80 mt-1">
                شركة ابن السنوسي للحلول المتكاملة • الخرطوم بحري كوبر • +249900009596
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-bold">
              توقيت السودان: <span className="font-mono">{sudanTime}</span>
            </div>
          </div>
        </div>

        {/* Vertical Form Fields */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* 1. حقل التاريخ والوقت (توقيت السودان) + اسم الموظف المسجل */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {/* التاريخ بتوقيت السودان */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                <span>التاريخ (توقيت السودان)</span>
              </label>
              <input
                type="text"
                readOnly
                value={sudanDate}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm font-bold text-slate-800 text-right"
              />
            </div>

            {/* الساعة بتوقيت السودان */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-blue" />
                <span>الساعة (توقيت السودان)</span>
              </label>
              <input
                type="text"
                readOnly
                value={sudanTime}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm font-bold text-slate-800 text-right"
              />
            </div>

            {/* اسم الموظف المسجل */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>اسم الموظف المسجل</span>
              </label>
              <input
                type="text"
                readOnly
                value={currentUser?.name || 'كاشير الفرع'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800"
              />
            </div>
          </div>

          {/* 2. اسم العميل وطريقة الدفع (حقول عمودية) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                اسم العميل <span className="text-slate-400 font-normal">(نقدي أو من قائمة العملاء)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={selectedCustomerId}
                  onChange={e => {
                    setSelectedCustomerId(e.target.value);
                    const selected = customers.find(c => c.id === e.target.value);
                    if (selected) setCustomerName(selected.name);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">عميل غير مسجل (يدوي)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="أدخل اسم العميل..."
                  value={customerName}
                  onChange={e => {
                    setCustomerName(e.target.value);
                    if (selectedCustomerId) setSelectedCustomerId('');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            {/* طريقة السداد (في خيار البيع) */}
            {isSaleMode ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">طريقة الدفع والسداد</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['نقداً', 'بنكك / تحويل بنكي', 'بطاقة مصرفية', 'آجل'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition-all text-center truncate ${
                        paymentMethod === method
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">نوع الوثيقة</label>
                <div className="px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  📄 عرض أسعار مبدئي (غير ملزم، صالح لمدة 7 أيام)
                </div>
              </div>
            )}
          </div>

          {/* 3. قائمة المنتجات والكمية وحساب السعر عمودياً مع زر إضافة منتج آخر */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-blue" />
                <span>الأصناف والمنتجات والكميات المطلوبة</span>
              </label>
              <span className="text-xs font-bold text-slate-400">
                يتم حساب السعر تلقائياً بناءً على الكمية وسعر المخزن
              </span>
            </div>

            {/* Product Rows List */}
            <div className="space-y-3">
              {formItems.map((item, index) => {
                const itemTotal = item.quantity * item.price;

                return (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-black text-slate-500">
                        المنتج رقم ({index + 1})
                      </span>
                      {formItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          <Trash className="w-3.5 h-3.5" />
                          <span>حذف هذا الصنف</span>
                        </button>
                      )}
                    </div>

                    {/* Form Item Grid: Product Dropdown | Quantity | Unit Price | Total */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      
                      {/* Product Select (6 cols) */}
                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-xs font-bold text-slate-600">اختر المنتج من المخزن *</label>
                        <select
                          value={item.productId}
                          onChange={e => handleProductSelect(item.id, e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-blue"
                        >
                          <option value="">-- اضغط لاختيار الصنف من المخزن --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (المخزن: {p.stock} | السعر: {p.price.toLocaleString()} ج.س)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity (2 cols) */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-600">الكمية *</label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="1"
                            max={isSaleMode ? (item.stock || 9999) : 9999}
                            value={item.quantity}
                            onChange={e => handleQuantityChange(item.id, e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm font-black text-center text-slate-800 focus:ring-2 focus:ring-brand-blue"
                          />
                        </div>
                      </div>

                      {/* Unit Price (2 cols) */}
                      <div className="sm:col-span-2 space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-600">سعر الوحدة</label>
                          {item.stock > 0 && isSaleMode && (
                            <span className="text-[10px] text-slate-400">متاح: {item.stock}</span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            value={item.price || ''}
                            onChange={e => handlePriceChange(item.id, Number(e.target.value))}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-brand-blue text-left"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* Subtotal for this product (3 cols) */}
                      <div className="sm:col-span-3 space-y-1 text-left">
                        <label className="text-xs font-bold text-slate-500 block">الإجمالي للصنف</label>
                        <div className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 font-mono font-black text-sm text-slate-800 text-left" dir="ltr">
                          {itemTotal.toLocaleString()} ج.س
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BUTTON TO ADD ANOTHER PRODUCT (زر إضافة منتج آخر كما طلب المستخدم) */}
            <button
              type="button"
              onClick={handleAddAnotherProduct}
              className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-brand-blue/40 hover:border-brand-blue hover:bg-blue-50/50 text-brand-blue font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منتج آخر إلى القائمة</span>
            </button>
          </div>

          {/* 4. TOTALS DISPLAY (عرض المجموع والتفقيط) */}
          <div className={`p-6 rounded-3xl border-2 space-y-3 ${
            isSaleMode 
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' 
              : 'bg-amber-50/70 border-amber-300 text-amber-950'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  {isSaleMode ? 'إجمالي قيمة المبيعات المستحقة:' : 'إجمالي قيمة الفاتورة المبدئية:'}
                </span>
                <p className="text-sm font-bold mt-0.5">
                  فقط {totalTafqeet} لا غير.
                </p>
              </div>

              <div className="text-left font-mono font-black text-2xl sm:text-3xl" dir="ltr">
                {totalAmount.toLocaleString()} <span className="text-sm font-bold">ج.س</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 flex justify-between">
              <span>إجمالي الأصناف: <strong>{validItems.length}</strong> أصناف</span>
              <span>إجمالي الوحدات: <strong>{totalQuantityUnits}</strong> قطعة</span>
            </div>
          </div>

          {/* 5. THE MAIN ACTION BUTTON (زر إكمال البيع / إصدار الفاتورة المبدئية) */}
          <button
            type="button"
            onClick={handleSubmitForm}
            disabled={validItems.length === 0}
            className={`w-full py-4 px-6 rounded-2xl text-white font-black text-base shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isSaleMode
                ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-900/30 active:scale-98'
                : 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 hover:from-amber-500 hover:to-orange-600 shadow-amber-900/30 active:scale-98'
            }`}
          >
            {isSaleMode ? (
              <>
                <CheckCircle2 className="w-6 h-6" />
                <span>إكمال البيع وإصدار الفاتورة الرسمية</span>
              </>
            ) : (
              <>
                <FileText className="w-6 h-6" />
                <span>إصدار الفاتورة المبدئية (عرض السعر للطباعة)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Official Printable Invoice Modal */}
      <OfficialInvoiceModal
        invoice={modalInvoice}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCurrentScreen('mode-selection');
        }}
        isProforma={isModalProforma}
        onNewSale={() => {
          setIsModalOpen(false);
          setCurrentScreen('mode-selection');
        }}
        onConvertToFinalSale={isModalProforma ? handleConvertToFinalSale : undefined}
      />
    </div>
  );
};

export default POS;
