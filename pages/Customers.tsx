import React, { useState } from 'react';
import { Customer, CustomerType } from '../types';
import { Users, Search, Plus, FileText, X } from '../components/Icons';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer?: (customer: Customer) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, onAddCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Customer Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<CustomerType>(CustomerType.INDIVIDUAL);
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState<number>(0);

  const filteredCustomers = customers.filter(c => 
    c.name.includes(searchTerm) || c.phone.includes(searchTerm) || c.address.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
      type,
      address: address.trim(),
      email: email.trim(),
      balance: Number(balance) || 0,
    };

    if (onAddCustomer) {
      onAddCustomer(newCustomer);
    }

    // Reset & Close
    setName('');
    setPhone('');
    setType(CustomerType.INDIVIDUAL);
    setAddress('');
    setEmail('');
    setBalance(0);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">العملاء</h2>
          <p className="text-gray-500 text-sm">قاعدة بيانات العملاء الأفراد والشركات وحساباتهم</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2.5 rounded-xl hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 active:scale-95 duration-200 text-sm font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="بحث عن عميل بالاسم أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm
                  ${customer.type === CustomerType.COMPANY ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-brand-blue'}
                `}>
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{customer.name}</h3>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                    customer.type === CustomerType.COMPANY ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {customer.type}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 opacity-50">📱</span>
                <span dir="ltr" className="text-right font-mono">{customer.phone || 'غير مسجل'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 opacity-50">📍</span>
                <span>{customer.address || 'بدون عنوان'}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 opacity-50">✉️</span>
                  <span className="font-mono text-xs">{customer.email}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400">الرصيد المالي</p>
                <p className={`font-bold font-mono text-base ${customer.balance > 0 ? 'text-rose-600' : customer.balance < 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                  {Math.abs(customer.balance).toLocaleString()} ج.س
                  <span className="text-xs font-sans mr-1">
                    {customer.balance > 0 ? ' (مستحق عليه)' : customer.balance < 0 ? ' (دائن له)' : ''}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-2xl text-center border border-gray-100 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>لا يوجد عملاء يطابقون معايير البحث.</p>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">إضافة عميل جديد</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">اسم العميل أو المؤسسة *</label>
                <input 
                  required 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" 
                  placeholder="مثال: شركة النيل للطاقة أو محمد أحمد"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">نوع العميل</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as CustomerType)} 
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-blue/20"
                  >
                    <option value={CustomerType.INDIVIDUAL}>فرد</option>
                    <option value={CustomerType.COMPANY}>شركة</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">رقم الهاتف</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-mono" 
                    placeholder="0912345678"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">العنوان / المدينة</label>
                <input 
                  type="text" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" 
                  placeholder="الخرطوم - شارع الستين"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">البريد الإلكتروني (اختياري)</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-mono" 
                    placeholder="client@domain.com"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">الرصيد الافتتاحي</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={balance} 
                    onChange={e => setBalance(Number(e.target.value))} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-mono" 
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-blue hover:bg-blue-800 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95"
                >
                  حفظ العميل سحابياً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
