import React, { useState, useEffect } from 'react';
import { Invoice, Product, Employee, Customer } from '../types';
import { 
  BarChart, Package, ShoppingCart, TrendingUp, DollarSign, 
  Calendar, Printer, Download, Filter, RefreshCw, Users, FileText 
} from '../components/Icons';
import { fetchInventoryLogsFromSupabase } from '../supabaseService';

interface ReportsProps {
  invoices: Invoice[];
  products: Product[];
  employees: Employee[];
  customers: Customer[];
}

interface SoldProductMetric {
  productId: string;
  sku: string;
  name: string;
  category: string;
  unitsSold: number;
  totalRevenue: number;
  estimatedCost: number;
  estimatedProfit: number;
  currentStock: number;
}

const Reports: React.FC<ReportsProps> = ({ 
  invoices, 
  products, 
  employees, 
  customers 
}) => {
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [activeTab, setActiveTab] = useState<'units' | 'financial' | 'staff' | 'logs'>('units');
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Load Inventory logs from Supabase
  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await fetchInventoryLogsFromSupabase();
      setInventoryLogs(logs);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Filter Invoices by Date
  const filteredInvoices = invoices.filter(inv => {
    if (dateFilter === 'all') return true;

    const invoiceDate = new Date(inv.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      return inv.date === today.toISOString().split('T')[0];
    }

    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      return invoiceDate >= weekAgo;
    }

    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(today.getMonth() - 1);
      return invoiceDate >= monthAgo;
    }

    return true;
  });

  // 1. Calculate Sold Units per Product
  const productMetricsMap: Record<string, SoldProductMetric> = {};

  // Initialize with all known products
  products.forEach(p => {
    productMetricsMap[p.id] = {
      productId: p.id,
      sku: p.sku || '',
      name: p.name,
      category: p.category,
      unitsSold: 0,
      totalRevenue: 0,
      estimatedCost: 0,
      estimatedProfit: 0,
      currentStock: p.stock
    };
  });

  // Accumulate from filtered invoices
  filteredInvoices.forEach(inv => {
    if (Array.isArray(inv.items)) {
      inv.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const costPrice = prod ? prod.cost : 0;
        const itemQuantity = Number(item.quantity) || 0;
        const itemRevenue = Number(item.total) || 0;
        const itemCost = itemQuantity * costPrice;
        const itemProfit = itemRevenue - itemCost;

        if (productMetricsMap[item.productId]) {
          productMetricsMap[item.productId].unitsSold += itemQuantity;
          productMetricsMap[item.productId].totalRevenue += itemRevenue;
          productMetricsMap[item.productId].estimatedCost += itemCost;
          productMetricsMap[item.productId].estimatedProfit += itemProfit;
        } else {
          // If product was deleted or custom item
          productMetricsMap[item.productId] = {
            productId: item.productId,
            sku: prod?.sku || 'N/A',
            name: item.productName || 'صنف مباع',
            category: prod?.category || 'عام',
            unitsSold: itemQuantity,
            totalRevenue: itemRevenue,
            estimatedCost: itemCost,
            estimatedProfit: itemProfit,
            currentStock: prod ? prod.stock : 0
          };
        }
      });
    }
  });

  const soldProductsList: SoldProductMetric[] = Object.values(productMetricsMap)
    .sort((a, b) => b.unitsSold - a.unitsSold);

  // Overall Totals
  const totalUnitsSold = soldProductsList.reduce((sum, item) => sum + item.unitsSold, 0);
  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalSubtotal = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.subtotal) || 0), 0);
  const totalTax = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.tax) || 0), 0);
  const totalDiscount = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.discount) || 0), 0);
  const totalEstimatedProfit = soldProductsList.reduce((sum, item) => sum + item.estimatedProfit, 0);

  // Category Breakdown
  const categorySalesMap: Record<string, { units: number; revenue: number }> = {};
  soldProductsList.forEach(item => {
    if (!categorySalesMap[item.category]) {
      categorySalesMap[item.category] = { units: 0, revenue: 0 };
    }
    categorySalesMap[item.category].units += item.unitsSold;
    categorySalesMap[item.category].revenue += item.totalRevenue;
  });

  // Staff Performance Breakdown
  const staffSalesMap: Record<string, { count: number; total: number; units: number }> = {};
  filteredInvoices.forEach(inv => {
    const emp = inv.employeeName || 'غير محدد';
    if (!staffSalesMap[emp]) {
      staffSalesMap[emp] = { count: 0, total: 0, units: 0 };
    }
    staffSalesMap[emp].count += 1;
    staffSalesMap[emp].total += Number(inv.total) || 0;
    const invUnits = (inv.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    staffSalesMap[emp].units += invUnits;
  });

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = ['رمز الصنف (SKU)', 'اسم المنتج', 'التصنيف', 'الكمية المباعة (وحدات)', 'إجمالي المبيعات (ج.س)', 'صافي الربح التقديري (ج.س)', 'المخزون الحالي'];
    const rows = soldProductsList.map(item => [
      item.sku,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      item.unitsSold,
      item.totalRevenue,
      item.estimatedProfit,
      item.currentStock
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_الوحدات_المباعة_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-800 pb-10">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart className="w-6 h-6 text-brand-blue" />
            <span>تقارير المبيعات وحساب الوحدات المباعة</span>
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            إحصائيات تفصيلية للأصناف الأكثر مبيعاً، الإيرادات، وحركة المخزون اللحظية في Supabase
          </p>
        </div>

        {/* Date Filter & Export */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            {(['all', 'month', 'week', 'today'] as const).map(period => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === period 
                    ? 'bg-white text-brand-blue shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period === 'all' && 'كل الفترات'}
                {period === 'month' && 'آخر 30 يوم'}
                {period === 'week' && 'آخر أسبوع'}
                {period === 'today' && 'اليوم فقط'}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-gray-200"
            title="طباعة التقرير"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">طباعة</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            title="تصدير ملف Excel / CSV"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Units Sold */}
        <div className="bg-gradient-to-br from-blue-900 to-brand-blue text-white p-5 rounded-2xl shadow-md border border-blue-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-blue-200 font-medium mb-1">إجمالي الوحدات المباعة</p>
              <h3 className="text-3xl font-extrabold font-mono">{totalUnitsSold.toLocaleString()}</h3>
              <p className="text-[11px] text-blue-200 mt-2">قطعة / جهاز مباع في المنظومة</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-brand-yellow">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">إجمالي الإيرادات</p>
              <h3 className="text-2xl font-bold text-gray-800 font-mono">{totalRevenue.toLocaleString()} <span className="text-xs font-sans">ج.س</span></h3>
              <p className="text-[11px] text-emerald-600 mt-2 font-medium">من {filteredInvoices.length} فاتورة مسجلة</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">الأرباح التقديرية (الهامش)</p>
              <h3 className="text-2xl font-bold text-emerald-700 font-mono">{totalEstimatedProfit.toLocaleString()} <span className="text-xs font-sans">ج.س</span></h3>
              <p className="text-[11px] text-gray-400 mt-2">سعر البيع مطروحاً منه سعر التكلفة</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Tax (VAT) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">ضريبة القيمة المضافة (15%)</p>
              <h3 className="text-2xl font-bold text-gray-800 font-mono">{totalTax.toLocaleString()} <span className="text-xs font-sans">ج.س</span></h3>
              <p className="text-[11px] text-gray-400 mt-2">المحصلة لصالح هيئة الضرائب</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 space-x-reverse space-x-3 text-sm font-bold">
        <button
          onClick={() => setActiveTab('units')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'units'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>جدول الوحدات المباعة بالتفصيل</span>
          <span className="text-xs bg-blue-50 text-brand-blue px-2 py-0.5 rounded-full">{soldProductsList.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('financial')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'financial'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>التحليل المالي وطرق الدفع</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>أداء الكاشير والموظفين</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-brand-blue text-brand-blue'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>سجل حركة المخزون اللحظي (Supabase Logs)</span>
        </button>
      </div>

      {/* Tab 1: Sold Units Breakdown Table */}
      {activeTab === 'units' && (
        <div className="space-y-6">
          {/* Category Quick Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(categorySalesMap).map(([cat, stats]) => (
              <div key={cat} className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-[11px] text-gray-500 font-medium truncate">{cat}</p>
                <p className="text-lg font-bold text-gray-800 font-mono mt-1">{stats.units} <span className="text-xs font-sans text-gray-400">وحدة</span></p>
                <p className="text-[10px] text-brand-blue font-mono mt-0.5">{stats.revenue.toLocaleString()} ج.س</p>
              </div>
            ))}
          </div>

          {/* Full Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <span>📦</span>
                <span>قائمة المنتجات وحساب المبيعات لكل وحدة</span>
              </h3>
              <span className="text-xs text-gray-400">مرتبة تنازلياً حسب الوحدات الأكثر مبيعاً</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">الترتيب</th>
                    <th className="px-4 py-3">رمز الصنف (SKU)</th>
                    <th className="px-4 py-3">اسم المنتج</th>
                    <th className="px-4 py-3">التصنيف</th>
                    <th className="px-4 py-3 text-center">الكمية المباعة</th>
                    <th className="px-4 py-3">إجمالي الإيرادات</th>
                    <th className="px-4 py-3">الربح التقديري</th>
                    <th className="px-4 py-3 text-center">المخزون الحالي</th>
                    <th className="px-4 py-3">نسبة البيع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {soldProductsList.map((item, index) => {
                    const percentage = totalUnitsSold > 0 ? (item.unitsSold / totalUnitsSold) * 100 : 0;

                    return (
                      <tr key={item.productId} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            index === 0 ? 'bg-amber-100 text-amber-800' :
                            index === 1 ? 'bg-slate-200 text-slate-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' : 'text-gray-400'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-gray-500 font-medium">{item.sku || '-'}</td>
                        <td className="px-4 py-3.5 font-bold text-gray-900">{item.name}</td>
                        <td className="px-4 py-3.5">
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold font-mono text-sm text-brand-blue">
                          {item.unitsSold}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-gray-800">
                          {item.totalRevenue.toLocaleString()} ج.س
                        </td>
                        <td className={`px-4 py-3.5 font-mono font-bold ${item.estimatedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.estimatedProfit.toLocaleString()} ج.س
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`font-mono px-2 py-0.5 rounded text-xs font-bold ${
                            item.currentStock > 10 ? 'bg-emerald-50 text-emerald-700' :
                            item.currentStock > 0 ? 'bg-amber-50 text-amber-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>
                            {item.currentStock}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 w-32">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-brand-blue h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              ></div>
                            </div>
                            <span className="font-mono text-[10px] text-gray-500 w-8">{percentage.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {soldProductsList.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                        لا توجد بيانات وحدات مباعة في الفترة المحددة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Financial Breakdown */}
      {activeTab === 'financial' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 border-b border-gray-100 pb-3">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>ملخص العمليات المالية</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-3 rounded-xl bg-gray-50">
                <span className="text-gray-600">المجموع الفرعي (قبل الضريبة والخصم):</span>
                <span className="font-mono font-bold text-gray-800">{totalSubtotal.toLocaleString()} ج.س</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-rose-50/60 text-rose-800">
                <span>إجمالي الخصومات الممنوحة:</span>
                <span className="font-mono font-bold">-{totalDiscount.toLocaleString()} ج.س</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-blue-50/60 text-blue-900">
                <span>ضريبة القيمة المضافة المحصلة (15%):</span>
                <span className="font-mono font-bold">+{totalTax.toLocaleString()} ج.س</span>
              </div>
              <div className="flex justify-between p-4 rounded-xl bg-emerald-50 text-emerald-900 text-base font-bold">
                <span>صافي الإيرادات الإجمالي:</span>
                <span className="font-mono text-lg">{totalRevenue.toLocaleString()} ج.س</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 border-b border-gray-100 pb-3">
              <FileText className="w-5 h-5 text-brand-blue" />
              <span>المبيعات حسب طرق الدفع</span>
            </h3>

            <div className="space-y-3">
              {(['نقداً', 'بنكك / تحويل بنكي', 'بطاقة مصرفية', 'آجل'] as const).map(method => {
                const methodInvoices = filteredInvoices.filter(inv => (inv.paymentMethod || 'نقداً').includes(method.split(' ')[0]));
                const methodTotal = methodInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
                const percent = totalRevenue > 0 ? (methodTotal / totalRevenue) * 100 : 0;

                return (
                  <div key={method} className="p-3 rounded-xl border border-gray-100 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-800">{method}</span>
                      <span className="font-mono font-bold text-brand-blue">{methodTotal.toLocaleString()} ج.س ({percent.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-blue h-full rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Staff Performance */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">مبيعات الكاشير والموظفين</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">اسم الموظف / الكاشير</th>
                  <th className="px-6 py-3 text-center">عدد الفواتير المصدرة</th>
                  <th className="px-6 py-3 text-center">إجمالي الوحدات المباعة</th>
                  <th className="px-6 py-3">إجمالي قيمة المبيعات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(staffSalesMap).map(([name, data]) => (
                  <tr key={name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-900">{name}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold">{data.count}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-brand-blue">{data.units}</td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-700">{data.total.toLocaleString()} ج.س</td>
                  </tr>
                ))}
                {Object.keys(staffSalesMap).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">لا توجد مبيعات مسجلة للموظفين حتى الآن</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Live Inventory Logs from Supabase */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 text-brand-blue ${isLoadingLogs ? 'animate-spin' : ''}`} />
                <span>سجل حركة البضائع والمخزون من Supabase</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">توثيق لحظي لكل عملية بيع أو شراء أو تعديل مخزني</p>
            </div>

            <button
              onClick={loadLogs}
              disabled={isLoadingLogs}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              <span>تحديث السجل</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">تاريخ ووقت الحركة</th>
                  <th className="px-6 py-3">نوع الحركة</th>
                  <th className="px-6 py-3 text-center">الكمية</th>
                  <th className="px-6 py-3">رقم المرجع (الفاتورة)</th>
                  <th className="px-6 py-3">التفاصيل والملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventoryLogs.map((log: any, idx: number) => (
                  <tr key={log.id || idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3.5 font-mono text-gray-500 text-[11px]">
                      {new Date(log.created_at || Date.now()).toLocaleString('ar-SA')}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        log.change_type === 'sale' 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {log.change_type === 'sale' ? 'صرف مبيعات (خروج)' : 'توريد / شراء (دخول)'}
                      </span>
                    </td>
                    <td className={`px-6 py-3.5 text-center font-bold font-mono text-sm ${
                      Number(log.quantity) < 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {log.quantity}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-brand-blue">
                      {log.reference_id || '-'}
                    </td>
                    <td className="px-6 py-3.5 text-gray-700 font-medium">
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))}

                {inventoryLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                      لا توجد حركات مخزنية مسجلة بعد. عند إجراء عمليات بيع بالكاشير ستظهر الحركات تلقائياً هنا.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
