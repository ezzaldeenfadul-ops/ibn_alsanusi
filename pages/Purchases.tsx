import React, { useState } from 'react';
import { PurchaseOrder, Supplier, Product, InvoiceItem } from '../types';
import { Truck, Plus, Search, FileText, Trash, ShoppingCart, X } from '../components/Icons';

interface PurchasesProps {
  suppliers: Supplier[];
  orders: PurchaseOrder[];
  products: Product[];
  onReceiveOrder: (id: string) => void;
  onSaveOrder: (order: PurchaseOrder) => void;
  onAddSupplier?: (supplier: Supplier) => void;
}

const Purchases: React.FC<PurchasesProps> = ({ 
  suppliers, 
  orders, 
  products, 
  onReceiveOrder, 
  onSaveOrder,
  onAddSupplier 
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [view, setView] = useState<'list' | 'create'>('list');
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);

  // New Supplier Form
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const newSupplier: Supplier = {
      id: Date.now().toString(),
      name: supName.trim(),
      contactPerson: supContact.trim(),
      phone: supPhone.trim(),
      email: supEmail.trim(),
      address: supAddress.trim(),
    };

    if (onAddSupplier) {
      onAddSupplier(newSupplier);
    }

    setSupName('');
    setSupContact('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
    setIsAddSupplierOpen(false);
  };

  // Create Order State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.includes(productSearch) || p.sku.includes(productSearch)
  );

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);

  const handleAddToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.productId === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      const newItem: InvoiceItem = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.cost, // Use cost for PO
        total: product.cost
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    setCartItems(cartItems.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQty, total: newQty * item.price }
        : item
    ));
  };

  const removeItem = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const handleSave = () => {
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier || cartItems.length === 0) return;

    const newOrder: PurchaseOrder = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      date: new Date().toISOString().split('T')[0],
      status: 'ordered',
      total: total,
      items: cartItems
    };

    onSaveOrder(newOrder);
    setView('list');
    setCartItems([]);
    setSelectedSupplierId('');
  };

  if (view === 'create') {
    return (
      <div className="space-y-6 flex flex-col h-full md:h-[calc(100vh-100px)] animate-fade-in">
        <div className="flex justify-between items-center shrink-0">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">أمر شراء جديد</h2>
          <button 
            onClick={() => setView('list')}
            className="text-gray-500 hover:text-gray-800 transition-colors bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-sm"
          >
            إلغاء وعودة
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
          {/* Left Panel: Product Selection */}
          <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[400px] lg:h-auto shrink-0 lg:shrink">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="بحث عن منتج لإضافته للطلب..."
                  className="w-full pl-4 pr-10 py-3 rounded-lg bg-white border border-gray-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <button 
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className="flex flex-col items-start p-4 rounded-lg border border-gray-200 hover:border-brand-blue hover:shadow-md transition-all text-right group bg-white active:scale-95 duration-100"
                  >
                    <span className="text-xs text-gray-400 mb-1">{product.category}</span>
                    <h4 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2">{product.name}</h4>
                    <div className="mt-auto w-full flex justify-between items-end">
                      <div>
                        <span className="text-xs text-gray-400 block">التكلفة</span>
                        <span className="font-bold text-gray-700">{product.cost.toLocaleString()}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        المخزون: {product.stock}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Order Details */}
          <div className="flex flex-col bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden h-auto lg:h-full">
            <div className="p-4 md:p-6 bg-gray-50 border-b border-gray-200">
              <label className="block text-sm font-bold text-gray-700 mb-2">اختر المورد</label>
              <select 
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-brand-blue bg-white"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
              >
                <option value="">-- اختر المورد --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 py-10">
                  <ShoppingCart className="w-12 h-12 mb-2" />
                  <p>قائمة الطلبات فارغة</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 animate-slide-in">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-sm text-gray-800">{item.productName}</p>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 mt-2">
                       <div className="flex items-center gap-2">
                         <span className="text-xs text-gray-500">الكمية:</span>
                         <input 
                           type="number"
                           min="1"
                           value={item.quantity}
                           onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                           className="w-20 p-1 text-center border border-gray-300 rounded focus:border-brand-blue focus:outline-none font-bold"
                         />
                       </div>
                       <div className="text-left">
                         <p className="font-bold text-sm">{item.total.toLocaleString()} ج.س</p>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-200 shadow-inner">
              <div className="flex justify-between text-xl font-bold text-gray-900 mb-4">
                <span>الإجمالي التقديري</span>
                <span>{total.toLocaleString()} ج.س</span>
              </div>
              
              <button 
                onClick={handleSave}
                disabled={!selectedSupplierId || cartItems.length === 0}
                className={`w-full py-3.5 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 duration-200
                  ${(!selectedSupplierId || cartItems.length === 0) 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-brand-blue text-white hover:bg-blue-800'
                  }`}
              >
                إرسال أمر الشراء
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">المشتريات والموردين</h2>
          <p className="text-gray-500 text-sm">إدارة طلبات الشراء وقاعدة بيانات الموردين</p>
        </div>
        <button 
          onClick={() => {
            if (activeTab === 'orders') setView('create');
            else setIsAddSupplierOpen(true);
          }}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-blue text-white px-4 py-2.5 rounded-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 active:scale-95 duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>
            {activeTab === 'orders' ? 'أمر شراء جديد' : 'إضافة مورد جديد'}
          </span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-2 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'orders' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500'}`}
        >
          طلبات الشراء
        </button>
        <button 
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 px-2 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'suppliers' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500'}`}
        >
          الموردين
        </button>
      </div>

      {activeTab === 'orders' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[800px]">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">رقم الطلب</th>
                  <th className="px-6 py-4 font-medium">المورد</th>
                  <th className="px-6 py-4 font-medium">التاريخ</th>
                  <th className="px-6 py-4 font-medium">الإجمالي</th>
                  <th className="px-6 py-4 font-medium">الحالة</th>
                  <th className="px-6 py-4 font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">#{order.id}</td>
                    <td className="px-6 py-4 text-gray-600">{order.supplierName}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{order.date}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">{order.total.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap
                        ${order.status === 'received' ? 'bg-green-100 text-green-700' : 
                          order.status === 'ordered' ? 'bg-blue-100 text-blue-700' : 
                          'bg-red-100 text-red-700'}`}>
                        {order.status === 'received' ? 'تم الاستلام' : order.status === 'ordered' ? 'تم الطلب' : 'ملغي'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      {order.status === 'ordered' && (
                        <button 
                          onClick={() => onReceiveOrder(order.id)}
                          className="text-green-600 hover:bg-green-50 px-3 py-1 rounded-lg transition-colors text-xs font-bold border border-green-200 whitespace-nowrap"
                        >
                          استلام المخزون
                        </button>
                      )}
                      <button className="text-brand-blue hover:bg-blue-50 p-2 rounded-lg transition-colors">
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">لا توجد طلبات شراء حالياً</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map(supplier => (
            <div key={supplier.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-orange-100 text-orange-600 w-10 h-10 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{supplier.name}</h3>
                  <p className="text-xs text-gray-500">{supplier.address}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">الشخص المسؤول:</span>
                  <span>{supplier.contactPerson}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">الهاتف:</span>
                  <span dir="ltr">{supplier.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">البريد:</span>
                  <span>{supplier.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">إضافة مورد جديد</h2>
              <button onClick={() => setIsAddSupplierOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">اسم المورد أو الشركة *</label>
                <input 
                  required 
                  type="text" 
                  value={supName} 
                  onChange={e => setSupName(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" 
                  placeholder="مثال: شركة تيسلا للطاقة أو المورد الدولي"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">الشخص المسؤول (Contact Person)</label>
                <input 
                  type="text" 
                  value={supContact} 
                  onChange={e => setSupContact(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" 
                  placeholder="م. أسامة يوسف"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">رقم الهاتف</label>
                  <input 
                    type="text" 
                    value={supPhone} 
                    onChange={e => setSupPhone(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 font-mono" 
                    placeholder="0911223344"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    value={supEmail} 
                    onChange={e => setSupEmail(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 font-mono" 
                    placeholder="info@supplier.com"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">العنوان / المقر</label>
                <input 
                  type="text" 
                  value={supAddress} 
                  onChange={e => setSupAddress(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20" 
                  placeholder="المنطقة الصناعية - بحري"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-blue hover:bg-blue-800 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95"
                >
                  حفظ المورد سحابياً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;