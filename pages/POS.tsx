import React, { useState } from 'react';
import { Invoice, Product, Customer, InvoiceItem, InvoiceStatus, Employee } from '../types';
import { 
  Search, Plus, Trash, ShoppingCart, Barcode, AlertTriangle, 
  Package, Printer, CheckCircle2, X, DollarSign, Clock, FileText 
} from '../components/Icons';
import OfficialInvoiceModal from '../components/OfficialInvoiceModal';

interface POSProps {
  products: Product[];
  customers: Customer[];
  onSaveInvoice: (invoice: Invoice) => void;
  onNavigateToInvoices: () => void;
  currentUser: Employee;
}

const POS: React.FC<POSProps> = ({ 
  products, 
  customers, 
  onSaveInvoice, 
  onNavigateToInvoices, 
  currentUser 
}) => {
  // Cashier State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState<string>('');
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Tax & Discount State
  const [taxRate, setTaxRate] = useState<number>(0.15); // 15% default or 0%
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'نقداً' | 'بنكك / تحويل بنكي' | 'بطاقة مصرفية' | 'آجل'>('نقداً');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  
  // Success & Receipt Modal State
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

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

  // Add Product to Cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`عذراً، المنتج (${product.name}) غير متوفر في المخزون حالياً!`);
      return;
    }

    const masterProduct = products.find(p => p.id === product.id);
    const trackSerial = masterProduct?.trackSerial || false;
    const existingItem = cartItems.find(item => item.productId === product.id);

    if (existingItem) {
      if (trackSerial) {
        return; // Serial items must be chosen via the serial checklist
      }
      if (existingItem.quantity >= product.stock) {
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
        quantity: trackSerial ? 0 : 1,
        price: product.price,
        total: trackSerial ? 0 : product.price,
        serialNumbers: []
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  // Update item quantity directly via input or +/-
  const handleUpdateQuantity = (itemId: string, rawQty: number | string, maxStock: number) => {
    const newQty = typeof rawQty === 'string' ? (rawQty === '' ? 0 : parseInt(rawQty, 10)) : rawQty;
    
    if (isNaN(newQty) || newQty < 0) return;
    
    if (newQty > maxStock) {
      alert(`تنبيه: الكمية المطلوبة (${newQty}) تتجاوز المتوفر في المخزن (${maxStock})! تم ضبطها على الحد الأقصى.`);
    }
    
    const finalQty = Math.min(newQty, maxStock);

    setCartItems(cartItems.map(item => 
      item.id === itemId 
        ? { ...item, quantity: finalQty, total: finalQty * item.price }
        : item
    ));
  };

  // Update item price directly in cart (custom price)
  const handleUpdatePrice = (itemId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setCartItems(cartItems.map(item => 
      item.id === itemId 
        ? { ...item, price: newPrice, total: item.quantity * newPrice }
        : item
    ));
  };

  const toggleSerial = (itemId: string, serial: string, price: number) => {
    setCartItems(cartItems.map(item => {
      if (item.id !== itemId) return item;

      const currentSerials = item.serialNumbers || [];
      let newSerials;
      if (currentSerials.includes(serial)) {
        newSerials = currentSerials.filter(s => s !== serial);
      } else {
        newSerials = [...currentSerials, serial];
      }

      return {
        ...item,
        serialNumbers: newSerials,
        quantity: newSerials.length,
        total: newSerials.length * price
      };
    }));
  };

  const removeItem = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  // Submit Invoice / Checkout
  const handleSaveInvoice = () => {
    if (cartItems.length === 0) {
      alert('يرجى إضافة منتجات إلى السلة أولاً لإصدار الفاتورة.');
      return;
    }

    if (cartItems.some(item => item.quantity <= 0)) {
      alert('يرجى تحديد كمية صحيحة (أكبر من 0) لجميع الأصناف المضافة أو حذف الأصناف الفارغة.');
      return;
    }

    if (paymentMethod === 'آجل' && !selectedCustomerId) {
      alert('تنبيه: يجب اختيار عميل مسجل من القائمة لإصدار فاتورة بيع آجل (ذمم).');
      return;
    }

    const currentDateTime = new Date();
    const finalCustomerId = selectedCustomer ? selectedCustomer.id : 'CASH';
    const finalCustomerName = selectedCustomer 
      ? selectedCustomer.name 
      : (customCustomerName.trim() || 'عميل نقدي');

    let status = InvoiceStatus.PAID;
    if (paymentMethod === 'آجل') {
      status = paidAmountNumber >= total ? InvoiceStatus.PAID : (paidAmountNumber > 0 ? InvoiceStatus.PARTIAL : InvoiceStatus.PENDING);
    }

    const newInvoice: Invoice = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      date: currentDateTime.toISOString().split('T')[0],
      time: currentDateTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      employeeName: currentUser.name || 'الكاشير',
      items: cartItems,
      subtotal,
      tax,
      discount: discountAmount,
      total,
      paidAmount: paidAmountNumber,
      status,
      paymentMethod,
      notes: paymentMethod === 'آجل' && paidAmountNumber < total
        ? `متبقي على العميل: ${(total - paidAmountNumber).toLocaleString()} ج.س`
        : undefined
    };

    // Save and sync with Supabase and global state (deducts stock and adds to sales list)
    onSaveInvoice(newInvoice);

    // Show receipt modal and banner
    setCompletedInvoice(newInvoice);
    setShowReceiptModal(true);
    setSuccessToast(`تم حفظ الفاتورة #${newInvoice.id} بنجاح وخصم ${totalUnits} وحدة من المخزن وإضافة المبلغ (${total.toLocaleString()} ج.س) لقائمة المبيعات!`);

    // Reset cashier cart for next customer
    setCartItems([]);
    setSelectedCustomerId('');
    setCustomCustomerName('');
    setDiscount(0);
    setAmountPaidInput('');
    setPaymentMethod('نقداً');

    // Auto-clear toast after 6 seconds
    setTimeout(() => {
      setSuccessToast(null);
    }, 6000);
  };

  return (
    <div className="space-y-4 flex flex-col h-full md:h-[calc(100vh-80px)] animate-fade-in">
      {/* Success Notification Banner */}
      {successToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between animate-slide-in text-xs sm:text-sm font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            <span>{successToast}</span>
          </div>
          <button 
            onClick={() => setSuccessToast(null)}
            className="text-white/80 hover:text-white mr-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>⚡</span>
            <span>نقاط البيع (الكاشير والمبيعات السريعة)</span>
          </h2>
          <p className="text-xs text-gray-500">حساب فوري للمبالغ، خصم لحظي من المخزن، وتحديث فوري لقائمة المبيعات</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>الموظف:</span>
            <span className="font-bold text-brand-blue">{currentUser.name}</span>
          </div>

          <button
            onClick={onNavigateToInvoices}
            className="text-xs font-bold bg-blue-50 text-brand-blue px-3.5 py-1.5 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200 flex items-center gap-1.5"
            title="الانتقال إلى سجل المبيعات والفواتير"
          >
            <FileText className="w-4 h-4" />
            <span>قائمة المبيعات والفواتير</span>
            <span dir="ltr">&rarr;</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 overflow-hidden min-h-0">
        {/* Left Panel: Products Catalog (Cols 7 of 12) */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[360px] lg:h-auto shrink-0 lg:shrink">
          {/* Search & Categories Bar */}
          <div className="p-3 border-b border-gray-100 bg-gray-50/70 space-y-2.5">
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="ابحث بالاسم أو رمز الصنف (SKU) لتحديده..."
                className="w-full pl-4 pr-10 py-2 rounded-xl bg-white border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all text-xs md:text-sm font-medium"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg whitespace-nowrap transition-all ${
                    selectedCategory === cat 
                      ? 'bg-brand-blue text-white shadow-sm' 
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'الكل' : cat}
                </button>
              ))}
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map(product => {
                const inCart = cartItems.find(i => i.productId === product.id);
                const isOutOfStock = product.stock <= 0;

                return (
                  <button 
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock}
                    className={`flex flex-col items-start p-3 rounded-xl border text-right transition-all group active:scale-95 duration-100 relative ${
                      isOutOfStock 
                        ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                        : inCart 
                        ? 'bg-blue-50/50 border-brand-blue shadow-sm ring-1 ring-brand-blue' 
                        : 'bg-white border-gray-200/80 hover:border-brand-blue hover:shadow-md'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-brand-blue text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {inCart.quantity} بالسلة
                      </span>
                    )}

                    <span className="text-[10px] text-gray-400 font-medium mb-0.5 line-clamp-1">{product.category}</span>
                    <h4 className="font-bold text-gray-800 text-xs mb-2 line-clamp-2 leading-snug">{product.name}</h4>
                    
                    <div className="mt-auto w-full flex justify-between items-end pt-2 border-t border-gray-50">
                      <div>
                        <span className="text-[10px] text-gray-400 block">سعر الوحدة</span>
                        <span className="font-bold text-brand-blue text-xs sm:text-sm font-mono">{product.price.toLocaleString()} ج.س</span>
                      </div>
                      
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        product.stock > product.minStock 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : product.stock > 0 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {product.stock > 0 ? `${product.stock} بالمخزن` : 'نفد'}
                      </span>
                    </div>

                    {product.trackSerial && (
                      <div className="mt-1.5 w-full pt-1 border-t border-gray-100 flex items-center gap-1 text-[10px] text-purple-700 font-bold">
                        <Barcode className="w-3 h-3" />
                        <span>سيريال ({product.serialNumbers?.length || 0})</span>
                      </div>
                    )}
                  </button>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-full py-16 text-center text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-25" />
                  <p className="text-sm font-bold text-gray-700">لا توجد منتجات مطابقة في المخزون</p>
                  <p className="text-xs text-gray-400 mt-1">أضف منتجات جديدة من شاشة المخزون للبدء بالبيع</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Invoice Cart & Arithmetic Calculation (Cols 5 of 12) */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden h-auto lg:h-full">
          {/* Customer Selection Header */}
          <div className="p-3.5 bg-slate-50/90 border-b border-gray-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <span>👤</span>
                <span>المشتري (العميل)</span>
              </label>
              {selectedCustomerId && (
                <button 
                  onClick={() => setSelectedCustomerId('')}
                  className="text-[11px] text-red-500 hover:underline"
                >
                  إلغاء التحديد (عميل نقدي)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select 
                className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 focus:border-brand-blue bg-white text-xs font-medium"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">-- عميل نقدي (Walk-in) --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                ))}
              </select>

              {!selectedCustomerId && (
                <input 
                  type="text"
                  placeholder="اسم المشتري النقدي (اختياري)..."
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 focus:border-brand-blue bg-white text-xs"
                />
              )}
            </div>
          </div>

          {/* Cart Items List with Quantity & Price Inputs */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[160px] custom-scrollbar">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                <ShoppingCart className="w-10 h-10 mb-2 opacity-25" />
                <p className="text-xs font-bold text-gray-500">لم يتم اختيار أي منتج بعد</p>
                <p className="text-[11px] text-gray-400 mt-1">اضغط على أي منتج من القائمة لتحديد العدد وحساب المبلغ</p>
              </div>
            ) : (
              cartItems.map(item => {
                const masterProduct = products.find(p => p.id === item.productId);
                const trackSerial = masterProduct?.trackSerial;
                const availableSerials = masterProduct?.serialNumbers || [];
                const maxStock = masterProduct ? masterProduct.stock : 999;
                
                return (
                  <div key={item.id} className="p-3 bg-gray-50/90 rounded-xl border border-gray-200/90 animate-slide-in space-y-2">
                    {/* Header Row: Title & Remove */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-gray-900 truncate">{item.productName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">المتاح في المخزن: {maxStock} قطعة</p>
                      </div>

                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        title="حذف من السلة"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {/* Interactive Arithmetic Calculation Row: (Quantity × Price = Total) */}
                    {trackSerial ? (
                      <div className="w-full bg-white p-2 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between text-[11px] font-bold text-purple-800 mb-1.5">
                          <span className="flex items-center gap-1">
                            <Barcode className="w-3 h-3" />
                            الأرقام التسلسلية المحددة:
                          </span>
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-mono">
                            العدد: {item.quantity} × {item.price.toLocaleString()} = {item.total.toLocaleString()} ج.س
                          </span>
                        </div>

                        <div className="max-h-20 overflow-y-auto space-y-1 custom-scrollbar">
                          {availableSerials.length > 0 ? (
                            availableSerials.map(sn => (
                              <label key={sn} className="flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-1 rounded text-[11px]">
                                <input 
                                  type="checkbox" 
                                  className="accent-brand-blue"
                                  checked={(item.serialNumbers || []).includes(sn)}
                                  onChange={() => toggleSerial(item.id, sn, item.price)}
                                />
                                <span className="font-mono text-gray-700">{sn}</span>
                              </label>
                            ))
                          ) : (
                            <p className="text-[11px] text-red-500 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              لا توجد أرقام تسلسلية متاحة في المخزون
                            </p>
                          )}
                        </div>
                        {item.quantity === 0 && (
                          <p className="text-[10px] text-red-500 mt-1 font-bold">* يجب اختيار رقم تسلسلي واحد على الأقل</p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white p-2 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-2">
                        {/* Quantity with +/- and Direct Number Input */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-gray-600">العدد:</span>
                          <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200 p-0.5">
                            <button 
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, maxStock)}
                              className="w-6 h-6 flex items-center justify-center text-gray-700 hover:bg-white rounded font-bold text-xs"
                              title="إنقاص"
                            >-</button>
                            <input 
                              type="number"
                              min="1"
                              max={maxStock}
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.id, e.target.value, maxStock)}
                              className="w-12 text-center text-xs font-bold font-mono bg-transparent focus:outline-none"
                            />
                            <button 
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, maxStock)}
                              className="w-6 h-6 flex items-center justify-center text-gray-700 hover:bg-white rounded font-bold text-xs"
                              title="زيادة"
                            >+</button>
                          </div>
                        </div>

                        {/* Price per unit input */}
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-gray-500">السعر:</span>
                          <input 
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleUpdatePrice(item.id, Number(e.target.value) || 0)}
                            className="w-20 px-1.5 py-0.5 text-xs font-mono font-bold border border-gray-200 rounded text-center focus:border-brand-blue"
                            title="تعديل سعر الوحدة"
                          />
                        </div>

                        {/* Item Total (Qty * Price) */}
                        <div className="text-left font-mono font-bold text-xs text-brand-blue">
                          = {item.total.toLocaleString()} ج.س
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Payment & Mathematical Totals Summary Footer */}
          <div className="p-3.5 bg-slate-50 border-t border-gray-200 space-y-2.5 shadow-inner">
            {/* Payment Method Selector */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-gray-600">طريقة الدفع:</label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500">الضريبة:</span>
                  <button
                    type="button"
                    onClick={() => setTaxRate(0)}
                    className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                      taxRate === 0 ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    0%
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxRate(0.15)}
                    className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                      taxRate === 0.15 ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    15%
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {(['نقداً', 'بنكك / تحويل بنكي', 'بطاقة مصرفية', 'آجل'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all truncate ${
                      paymentMethod === method 
                        ? 'bg-brand-blue text-white shadow-sm' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount & Amount Received Row */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-gray-500 font-bold block mb-0.5">خصم إجمالي (ج.س):</label>
                <input 
                  type="number"
                  min="0"
                  placeholder="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-mono bg-white focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                  {paymentMethod === 'آجل' ? 'المبلغ المقدم المدفوع:' : 'المبلغ المستلم:'}
                </label>
                <input 
                  type="number"
                  placeholder={total.toString()}
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(e.target.value)}
                  className="w-full px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-mono bg-white focus:border-brand-blue"
                />
              </div>
            </div>

            {/* Clear Mathematical Calculations Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-gray-200 text-xs text-gray-700 bg-white p-2.5 rounded-xl border border-gray-100">
              <div className="flex justify-between">
                <span>إجمالي عدد القطع المحددة:</span>
                <span className="font-mono font-bold text-gray-900">{totalUnits} قطعة</span>
              </div>
              <div className="flex justify-between">
                <span>المجموع الفرعي للأصناف:</span>
                <span className="font-mono font-bold">{subtotal.toLocaleString()} ج.س</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>الخصم الممنوح:</span>
                  <span className="font-mono font-bold">-{discountAmount.toLocaleString()} ج.س</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>ضريبة القيمة المضافة ({(taxRate * 100).toFixed(0)}%):</span>
                  <span className="font-mono font-bold">+{tax.toLocaleString()} ج.س</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-brand-blue pt-1.5 border-t border-gray-200">
                <span>إجمالي الفاتورة المستحق:</span>
                <span className="font-mono text-lg">{total.toLocaleString()} ج.س</span>
              </div>

              {changeAmount > 0 && paymentMethod !== 'آجل' && (
                <div className="flex justify-between text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 mt-1">
                  <span>الباقي للعميل:</span>
                  <span className="font-mono">{changeAmount.toLocaleString()} ج.س</span>
                </div>
              )}
            </div>

            {/* Checkout Action Button - زر البيع الرئيسي */}
            <button 
              onClick={handleSaveInvoice}
              disabled={cartItems.length === 0 || cartItems.some(i => i.quantity <= 0)}
              className={`w-full py-4 rounded-2xl font-bold text-base shadow-xl transition-all active:scale-95 duration-200 flex items-center justify-center gap-3 cursor-pointer ${
                cartItems.length === 0 || cartItems.some(i => i.quantity <= 0)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/30 hover:shadow-emerald-900/40'
              }`}
            >
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <span>إتمام البيع وحفظ الفاتورة ({total.toLocaleString()} ج.س)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Letterhead Invoice Modal (الورق المروس الفاخر للطباعة) */}
      <OfficialInvoiceModal
        invoice={completedInvoice}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        onNewSale={() => setShowReceiptModal(false)}
      />
    </div>
  );
};

export default POS;
