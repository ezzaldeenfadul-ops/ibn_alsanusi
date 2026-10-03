import React, { useState } from 'react';
import { Invoice, Product, Customer, InvoiceItem, InvoiceStatus, Employee } from '../types';
import { 
  Search, Plus, Trash, ShoppingCart, Barcode, AlertTriangle, 
  Package, Printer, CheckCircle2, X, DollarSign, Clock, FileText, CheckCircle2 as CheckIcon
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

type POSMode = 'sale' | 'proforma';

const POS: React.FC<POSProps> = ({ 
  products, 
  customers, 
  onSaveInvoice, 
  onNavigateToInvoices, 
  currentUser 
}) => {
  // 1. Core POS Mode: 'sale' (عملية بيع نهائية) OR 'proforma' (فاتورة مبدئية / عرض سعر)
  const [posMode, setPosMode] = useState<POSMode>('sale');

  // Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState<string>('');
  
  // Cart & Catalog State
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Calculations & Financials
  const [taxRate, setTaxRate] = useState<number>(0); // 0% or 0.15 (15%)
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'نقداً' | 'بنكك / تحويل بنكي' | 'بطاقة مصرفية' | 'آجل'>('نقداً');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  
  // Modal & Toast State
  const [activeModalInvoice, setActiveModalInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalIsProforma, setModalIsProforma] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'amber' } | null>(null);

  // Derived Values
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.sku.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate Totals Live
  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalUnits = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const discountAmount = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = taxableAmount * taxRate;
  const total = taxableAmount + tax;

  const paidAmountNumber = paymentMethod === 'آجل' 
    ? (amountPaidInput ? Number(amountPaidInput) : 0)
    : (amountPaidInput ? Number(amountPaidInput) : total);

  const changeAmount = paidAmountNumber > total ? paidAmountNumber - total : 0;
  const tafqeetText = tafqeet(total, 'جنيه');

  // Add Product to Cart
  const handleAddToCart = (product: Product) => {
    // In final sale mode: verify stock
    if (posMode === 'sale' && product.stock <= 0) {
      alert(`عذراً، المنتج (${product.name}) غير متوفر في المخزون حالياً لإتمام عملية البيع!`);
      return;
    }

    const masterProduct = products.find(p => p.id === product.id);
    const trackSerial = masterProduct?.trackSerial || false;
    const existingItem = cartItems.find(item => item.productId === product.id);

    if (existingItem) {
      if (trackSerial && posMode === 'sale') {
        return; // Serial items must be selected from the serial picker
      }
      if (posMode === 'sale' && existingItem.quantity >= product.stock) {
        alert(`لا يمكن إضافة المزيد، الكمية المتوفرة في المخزون هي ${product.stock} فقط.`);
        return;
      }
      const newQty = existingItem.quantity + 1;
      setCartItems(cartItems.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: newQty, total: newQty * item.price }
          : item
      ));
    } else {
      const newItem: InvoiceItem = {
        id: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        total: product.price,
        serialNumbers: []
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  // Update item quantity directly via input or +/-
  const handleUpdateQuantity = (itemId: string, rawQty: number | string, maxStock: number) => {
    const newQty = typeof rawQty === 'string' ? (rawQty === '' ? 0 : parseInt(rawQty, 10)) : rawQty;
    
    if (isNaN(newQty) || newQty < 0) return;
    
    if (posMode === 'sale' && newQty > maxStock) {
      alert(`تنبيه: الكمية المطلوبة (${newQty}) تتجاوز المتوفر في المخزن (${maxStock})! تم ضبطها على الحد الأقصى.`);
    }
    
    const finalQty = posMode === 'sale' ? Math.min(newQty, maxStock) : newQty;

    setCartItems(cartItems.map(item => 
      item.id === itemId 
        ? { ...item, quantity: finalQty, total: finalQty * item.price }
        : item
    ));
  };

  // Update item price directly in cart (useful for quotes / customized pricing)
  const handleUpdatePrice = (itemId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setCartItems(cartItems.map(item => 
      item.id === itemId 
        ? { ...item, price: newPrice, total: item.quantity * newPrice }
        : item
    ));
  };

  const removeItem = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    if (cartItems.length === 0) return;
    if (window.confirm('هل تريد تفريغ السلة والبدء من جديد؟')) {
      setCartItems([]);
      setDiscount(0);
      setAmountPaidInput('');
    }
  };

  // 2. Execute Action: Either Final Sale OR Proforma Invoice
  const handleProcessOrder = () => {
    if (cartItems.length === 0) {
      alert('يرجى إضافة أصناف إلى السلة أولاً للمتابعة.');
      return;
    }

    if (cartItems.some(item => item.quantity <= 0)) {
      alert('يرجى تحديد كمية صحيحة (أكبر من 0) لجميع الأصناف المضافة.');
      return;
    }

    if (posMode === 'sale' && paymentMethod === 'آجل' && !selectedCustomerId) {
      alert('تنبيه: يجب اختيار عميل مسجل من القائمة لإصدار فاتورة بيع آجل (ذمم).');
      return;
    }

    const currentDateTime = new Date();
    const finalCustomerId = selectedCustomer ? selectedCustomer.id : 'CASH';
    const finalCustomerName = selectedCustomer 
      ? selectedCustomer.name 
      : (customCustomerName.trim() || (posMode === 'sale' ? 'عميل نقدي' : 'عميل استفسار / عرض أسعار'));

    let status = InvoiceStatus.PAID;
    if (posMode === 'sale' && paymentMethod === 'آجل') {
      status = paidAmountNumber >= total ? InvoiceStatus.PAID : (paidAmountNumber > 0 ? InvoiceStatus.PARTIAL : InvoiceStatus.PENDING);
    } else if (posMode === 'proforma') {
      status = 'مبدئية' as any;
    }

    // Build Invoice Object
    const generatedInvoice: Invoice = {
      id: posMode === 'sale' ? `INV-${Date.now().toString().slice(-6)}` : `QUO-${Date.now().toString().slice(-6)}`,
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      date: currentDateTime.toISOString().split('T')[0],
      time: currentDateTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      employeeName: currentUser?.name || 'مسؤول الكاشير',
      items: [...cartItems],
      subtotal,
      tax,
      discount: discountAmount,
      total,
      paidAmount: posMode === 'sale' ? paidAmountNumber : total,
      status,
      paymentMethod: posMode === 'sale' ? paymentMethod : 'عرض أسعار مبدئي',
      notes: posMode === 'sale' 
        ? (paymentMethod === 'آجل' && paidAmountNumber < total ? `متبقي على العميل: ${(total - paidAmountNumber).toLocaleString()} ج.س` : undefined)
        : 'فاتورة مبدئية غير ملزمة صالحة لمدة 7 أيام - لم تسجل كعملية بيع نهائية'
    };

    if (posMode === 'sale') {
      // 🛒 وضع البيع النهائي:
      // يتم حفظ العملية، خصم المخزون، وتسجيلها في قائمة المبيعات الرسمية
      onSaveInvoice(generatedInvoice);

      setActiveModalInvoice(generatedInvoice);
      setModalIsProforma(false);
      setIsModalOpen(true);
      setFeedbackToast({
        message: `تم حفظ عملية البيع بنجاح برقم الفاتورة #${generatedInvoice.id} وخصم ${totalUnits} وحدة من المخزن!`,
        type: 'success'
      });

      // تفريغ السلة للاستعداد للعميل التالي
      setCartItems([]);
      setSelectedCustomerId('');
      setCustomCustomerName('');
      setDiscount(0);
      setAmountPaidInput('');
    } else {
      // 📄 وضع الفاتورة المبدئية:
      // يتم فقط إصدار الفاتورة وعرضها للطباعة أو الحفظ كـ PDF
      // **دون حفظها في سجل المبيعات ودون خصم أي كمية من المخزون**
      setActiveModalInvoice(generatedInvoice);
      setModalIsProforma(true);
      setIsModalOpen(true);
      setFeedbackToast({
        message: `تم إصدار الفاتورة المبدئية (عرض السعر) #${generatedInvoice.id} بنجاح للطباعة دون حفظها في المبيعات ودون التأثير على المخزون!`,
        type: 'amber'
      });
    }
  };

  // Convert a Proforma invoice to a Final Sale directly from modal
  const handleConvertToFinalSale = (proformaInvoice: Invoice) => {
    const finalSaleInvoice: Invoice = {
      ...proformaInvoice,
      id: `INV-${Date.now().toString().slice(-6)}`,
      paymentMethod: 'نقداً',
      status: InvoiceStatus.PAID,
      notes: 'تم تحويلها من فاتورة مبدئية إلى بيع نهائي معتمد'
    };

    onSaveInvoice(finalSaleInvoice);
    setActiveModalInvoice(finalSaleInvoice);
    setModalIsProforma(false);
    setFeedbackToast({
      message: `تم تحويل الفاتورة بنجاح إلى بيع نهائي برقم #${finalSaleInvoice.id} وحفظها في المبيعات وخصم المخزون!`,
      type: 'success'
    });
    setCartItems([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-3 sm:p-5 bg-slate-50 gap-4 overflow-hidden">
      
      {/* 1. TOP HEADER & MODE SELECTOR (خيارات الكاشير: البيع أو الفاتورة المبدئية) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        
        {/* Title and Cashier Info */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className={`p-2.5 rounded-xl text-white shadow-md ${
            posMode === 'sale' ? 'bg-brand-blue shadow-blue-900/20' : 'bg-amber-600 shadow-amber-900/20'
          }`}>
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-800">نظام الكاشير الذكي</h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                الموظف: {currentUser?.name || 'كاشير الفرع'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {posMode === 'sale' 
                ? '⚡ وضع البيع المباشر: إصدار فاتورة معتمدة، خصم المخزون وحفظ العملية.' 
                : '📋 وضع الفاتورة المبدئية: إصدار عرض أسعار ومواصفات دون خصم المخزون أو الحفظ في المبيعات.'}
            </p>
          </div>
        </div>

        {/* 2 DISTINCT MODE CARDS (الخياران الأساسيان للكاشير) */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto border border-slate-200/80 shadow-inner">
          {/* Option A: Final Sale */}
          <button
            type="button"
            onClick={() => setPosMode('sale')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              posMode === 'sale'
                ? 'bg-gradient-to-r from-brand-blue to-blue-700 text-white shadow-md shadow-blue-900/25 scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <CheckIcon className="w-4 h-4" />
            <div className="text-right">
              <div className="leading-tight">🛒 عملية بيع نهائية</div>
              <div className={`text-[10px] font-normal ${posMode === 'sale' ? 'text-blue-200' : 'text-slate-400'}`}>
                حفظ بالمبيعات + خصم مخزون
              </div>
            </div>
          </button>

          {/* Option B: Proforma Invoice */}
          <button
            type="button"
            onClick={() => setPosMode('proforma')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              posMode === 'proforma'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-900/25 scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <div className="text-right">
              <div className="leading-tight">📄 فاتورة مبدئية (عرض سعر)</div>
              <div className={`text-[10px] font-normal ${posMode === 'proforma' ? 'text-amber-200' : 'text-slate-400'}`}>
                للطباعة والمعاينة فقط دون حفظ
              </div>
            </div>
          </button>
        </div>

        {/* Invoices Link */}
        <button
          type="button"
          onClick={onNavigateToInvoices}
          className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-brand-blue bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
        >
          <FileText className="w-4 h-4" />
          <span>سجل الفواتير السابقة</span>
        </button>
      </div>

      {/* FEEDBACK TOAST */}
      {feedbackToast && (
        <div className={`p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-between animate-fade-in shrink-0 ${
          feedbackToast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
            : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            <span>{feedbackToast.type === 'success' ? '✅' : '📄'}</span>
            <span>{feedbackToast.message}</span>
          </div>
          <button 
            onClick={() => setFeedbackToast(null)} 
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. MAIN WORKSPACE (2-COLUMN POS LAYOUT) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0">
        
        {/* RIGHT COLUMN: Product Catalog & Fast Search (7 cols on Desktop) */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
          
          {/* Search & Categories Bar */}
          <div className="p-3.5 border-b border-slate-200 space-y-3 bg-slate-50/70 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن منتج بالاسم، الكود، أو امسح الباركود..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full pr-11 pl-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all bg-white"
                autoFocus
              />
              {productSearch && (
                <button
                  onClick={() => setProductSearch('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? posMode === 'sale'
                        ? 'bg-brand-blue text-white shadow-sm'
                        : 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'all' ? 'جميع الأصناف' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 p-3.5 overflow-y-auto custom-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <Package className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
                <p className="font-bold text-sm text-slate-600">لا توجد منتجات مطابقة للبحث</p>
                <p className="text-xs text-slate-400 mt-1">تأكد من كتابة الاسم بشكل صحيح أو أضف منتجات جديدة من شاشة المخزون</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filteredProducts.map(product => {
                  const isOutOfStock = product.stock <= 0;
                  const inCartItem = cartItems.find(i => i.productId === product.id);
                  const isTrackSerial = product.trackSerial;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleAddToCart(product)}
                      className={`relative group bg-white rounded-xl border p-3 flex flex-col justify-between transition-all select-none cursor-pointer shadow-sm hover:shadow-md ${
                        inCartItem 
                          ? posMode === 'sale'
                            ? 'border-brand-blue ring-1 ring-brand-blue bg-blue-50/20'
                            : 'border-amber-500 ring-1 ring-amber-500 bg-amber-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      } ${isOutOfStock && posMode === 'sale' ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'active:scale-97'}`}
                    >
                      {/* Quantity in Cart Badge */}
                      {inCartItem && (
                        <div className={`absolute top-2 left-2 w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center shadow-md animate-scale-up ${
                          posMode === 'sale' ? 'bg-brand-blue' : 'bg-amber-600'
                        }`}>
                          {inCartItem.quantity}
                        </div>
                      )}

                      {/* Serial Tag */}
                      {isTrackSerial && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          سيريال
                        </span>
                      )}

                      {/* Content */}
                      <div className="mt-2">
                        <span className="text-[10px] text-slate-400 font-medium block truncate">{product.category || 'صنف'}</span>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 mt-0.5 leading-snug group-hover:text-brand-blue transition-colors">
                          {product.name}
                        </h3>
                        {product.sku && (
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{product.sku}</span>
                        )}
                      </div>

                      {/* Price and Stock */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="font-black text-sm text-brand-blue font-mono">
                          {product.price.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">ج.س</span>
                        </div>
                        <div className="text-[10px]">
                          {isOutOfStock ? (
                            <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                              {posMode === 'proforma' ? 'طلب مسبق' : 'نفذ'}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">
                              المخزن: <strong className="text-slate-700">{product.stock}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* LEFT COLUMN: The Ticket / Cart / Checkout Summary (5 cols on Desktop) */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
          
          {/* Cart Header with Mode Badge */}
          <div className={`p-3.5 border-b flex items-center justify-between shrink-0 ${
            posMode === 'sale' 
              ? 'bg-blue-50/60 border-blue-200' 
              : 'bg-amber-50/60 border-amber-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${posMode === 'sale' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <div>
                <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <span>{posMode === 'sale' ? 'سلة البيع النهائي' : 'سلة الفاتورة المبدئية'}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    posMode === 'sale' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {posMode === 'sale' ? 'فاتورة معتمدة' : 'عرض أسعار فقط'}
                  </span>
                </h2>
                <span className="text-[10px] text-slate-500">
                  {cartItems.length} أصناف • {totalUnits} وحدات
                </span>
              </div>
            </div>

            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                title="تفريغ السلة بالكامل"
              >
                <Trash className="w-3.5 h-3.5" />
                <span>إفراغ</span>
              </button>
            )}
          </div>

          {/* Customer Selection Row */}
          <div className="p-3 bg-slate-50/70 border-b border-slate-200 shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>بيانات العميل:</span>
              {selectedCustomer && (
                <span className="text-[10px] text-brand-blue font-medium">
                  الرصيد/الذمة: {Number(selectedCustomer.balance || 0).toLocaleString()} ج.س
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedCustomerId}
                onChange={e => {
                  setSelectedCustomerId(e.target.value);
                  if (e.target.value) setCustomCustomerName('');
                }}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-brand-blue focus:border-brand-blue"
              >
                <option value="">عميل نقدي مباشر / غير مسجل</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="اسم العميل (اختياري/يدوي)..."
                value={customCustomerName}
                onChange={e => {
                  setCustomCustomerName(e.target.value);
                  if (e.target.value) setSelectedCustomerId('');
                }}
                disabled={!!selectedCustomerId}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-brand-blue focus:border-brand-blue disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar min-h-[140px]">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingCart className="w-10 h-10 stroke-[1.5] mb-2 text-slate-300" />
                <p className="font-bold text-xs sm:text-sm text-slate-600">السلة فارغة حالياً</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                  اضغط على أي منتج من القائمة باليمين لإضافته وإصدار {posMode === 'sale' ? 'فاتورة البيع' : 'الفاتورة المبدئية'}.
                </p>
              </div>
            ) : (
              cartItems.map((item, index) => {
                const masterProduct = products.find(p => p.id === item.productId);
                const maxStock = masterProduct ? masterProduct.stock : 9999;
                const isTrackSerial = masterProduct?.trackSerial || false;

                return (
                  <div 
                    key={item.id} 
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-2 text-xs"
                  >
                    {/* Item Top: Name, Unit Price, Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-400">#{index + 1}</span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">{item.productName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-slate-500">سعر الوحدة:</span>
                          <input
                            type="number"
                            value={item.price}
                            onChange={e => handleUpdatePrice(item.id, Number(e.target.value))}
                            className="w-20 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-xs text-brand-blue font-bold bg-white text-left"
                            dir="ltr"
                            title="يمكن تعديل السعر المباشر"
                          />
                          <span className="text-[10px] text-slate-400">ج.س</span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="حذف الصنف"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Item Bottom: Quantity Adjuster & Row Total */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, maxStock)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 active:scale-95 text-sm"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={posMode === 'sale' ? maxStock : 9999}
                          value={item.quantity}
                          onChange={e => handleUpdateQuantity(item.id, e.target.value, maxStock)}
                          className="w-12 h-7 rounded-lg border border-slate-200 text-center font-mono font-bold text-xs bg-white text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, maxStock)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 active:scale-95 text-sm"
                        >
                          +
                        </button>
                        {posMode === 'sale' && (
                          <span className="text-[10px] text-slate-400 mr-1">
                            (المتاح: {maxStock})
                          </span>
                        )}
                      </div>

                      {/* Row Total */}
                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 block">الإجمالي:</span>
                        <span className="font-mono font-black text-sm text-brand-blue" dir="ltr">
                          {item.total.toLocaleString()} ج.س
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Calculations, Payment & Action Button Footer */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 shrink-0 space-y-3">
            
            {/* Discount & VAT Controls */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-medium">الخصم (ج.س):</span>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-16 text-left font-mono font-bold text-rose-600 text-xs border-0 bg-transparent focus:ring-0 p-0"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-medium">ضريبة القيمة المضافة:</span>
                <button
                  type="button"
                  onClick={() => setTaxRate(taxRate === 0 ? 0.15 : 0)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    taxRate > 0 
                      ? 'bg-brand-blue text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {taxRate > 0 ? 'مفعلة (15%)' : 'معفى (0%)'}
                </button>
              </div>
            </div>

            {/* Payment Method Selector (Only for Final Sale) */}
            {posMode === 'sale' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                  <span>طريقة السداد:</span>
                  <span>{paymentMethod}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  {(['نقداً', 'بنكك / تحويل بنكي', 'بطاقة مصرفية', 'آجل'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1.5 px-1 rounded-lg font-bold border transition-all text-center truncate ${
                        paymentMethod === method
                          ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Proforma Notice Box */}
            {posMode === 'proforma' && (
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium leading-relaxed flex items-center gap-1.5">
                <span>ℹ️</span>
                <span>سيتم إصدار فاتورة مبدئية كعرض أسعار رسمي دون التأثير على حسابات الأرباح أو المخازن.</span>
              </div>
            )}

            {/* Total Highlight Display */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              posMode === 'sale' 
                ? 'bg-blue-50/80 border-blue-200 text-brand-blue' 
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}>
              <div>
                <span className="text-[11px] font-bold block text-slate-500">
                  {posMode === 'sale' ? 'الصافي المطلوب سداده:' : 'إجمالي عرض السعر المبدئي:'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[190px]">
                  فقط {tafqeetText}
                </span>
              </div>
              <div className="text-left font-mono font-black text-xl sm:text-2xl" dir="ltr">
                {total.toLocaleString()} <span className="text-xs font-bold">ج.س</span>
              </div>
            </div>

            {/* BIG ACTION BUTTON (الزر الرئيسي الذكي) */}
            <button
              type="button"
              onClick={handleProcessOrder}
              disabled={cartItems.length === 0}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                posMode === 'sale'
                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-900/25 active:scale-98'
                  : 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 hover:from-amber-500 hover:to-orange-600 shadow-amber-900/25 active:scale-98'
              }`}
            >
              {posMode === 'sale' ? (
                <>
                  <Printer className="w-5 h-5" />
                  <span>إتمام البيع وحفظ الفاتورة الرسمية</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>إصدار وطباعة الفاتورة المبدئية (عرض السعر)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. OFFICIAL INVOICE MODAL (FOR BOTH FINAL SALE & PROFORMA) */}
      <OfficialInvoiceModal
        invoice={activeModalInvoice}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isProforma={modalIsProforma}
        onNewSale={() => {
          setIsModalOpen(false);
          setCartItems([]);
        }}
        onConvertToFinalSale={modalIsProforma ? handleConvertToFinalSale : undefined}
      />
    </div>
  );
};

export default POS;
