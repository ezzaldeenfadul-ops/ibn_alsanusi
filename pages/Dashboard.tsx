import React from 'react';
import { Package, ShoppingCart, Users, AlertTriangle, FileText } from '../components/Icons';
import { Invoice, Product, Customer } from '../types';

interface DashboardProps {
  products: Product[];
  invoices: Invoice[];
  customers: Customer[];
}

const StatCard = ({ title, value, sub, icon: Icon, color, subColor }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between transition-transform hover:-translate-y-1 duration-200">
    <div>
      <p className="text-gray-500 text-sm mb-1 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      <p className={`text-xs mt-2 ${subColor || 'text-gray-400'}`}>{sub}</p>
    </div>
    <div className={`p-3 rounded-lg ${color} shadow-lg shadow-opacity-20`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ products, invoices, customers }) => {
  const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const recentInvoices = invoices.slice(0, 5);
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">نظرة عامة</h2>
        <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border shadow-sm">
          {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="إجمالي المبيعات" 
          value={`${totalSales.toLocaleString()} ج.س`} 
          sub={totalSales > 0 ? 'مجموع الفواتير المصدرة' : 'لا توجد مبيعات مسجلة حتى الآن'} 
          subColor={totalSales > 0 ? 'text-green-600' : 'text-gray-400'}
          icon={ShoppingCart} 
          color="bg-green-500" 
        />
        <StatCard 
          title="تنبيهات المخزون" 
          value={lowStockCount} 
          sub={lowStockCount > 0 ? `${lowStockCount} منتجات وصلت للحد الأدنى` : 'لا توجد نواقص في المخزون'} 
          subColor={lowStockCount > 0 ? 'text-red-500' : 'text-gray-400'}
          icon={AlertTriangle} 
          color="bg-red-500" 
        />
        <StatCard 
          title="العملاء المسجلين" 
          value={customers.length} 
          sub={customers.length > 0 ? `${customers.length} عميل في قاعدة البيانات` : 'قاعدة بيانات العملاء فارغة'} 
          icon={Users} 
          color="bg-brand-blue" 
        />
        <StatCard 
          title="المنتجات في المخزون" 
          value={products.length} 
          sub={products.length > 0 ? `${products.length} صنف مسجل في المنظومة` : 'المخزون فارغ حالياً'} 
          icon={Package} 
          color="bg-brand-yellow" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-blue" />
              أحدث الفواتير
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[600px]">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">رقم الفاتورة</th>
                  <th className="px-6 py-3 font-medium">العميل</th>
                  <th className="px-6 py-3 font-medium">التاريخ</th>
                  <th className="px-6 py-3 font-medium">المبلغ</th>
                  <th className="px-6 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 font-mono">#{inv.id}</td>
                      <td className="px-6 py-4 text-gray-600">{inv.customerName}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm font-mono">{inv.date}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{inv.total.toLocaleString()} ج.س</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap
                          ${inv.status === 'مدفوع' ? 'bg-green-100 text-green-700' : 
                            inv.status === 'مدفوع جزئياً' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-gray-100 text-gray-700'}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      لا توجد فواتير صادرة حتى الآن
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            تنبيهات المخزون
          </h3>
          <div className="space-y-4">
            {products.filter(p => p.stock <= p.minStock).map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                <div className="bg-white p-2 rounded-full shadow-sm">
                  <Package className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{item.name}</p>
                  <p className="text-xs text-red-600 font-medium">المتبقي: {item.stock} فقط (الحد الأدنى: {item.minStock})</p>
                </div>
              </div>
            ))}
            {products.filter(p => p.stock <= p.minStock).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">المخزون في حالة جيدة</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;