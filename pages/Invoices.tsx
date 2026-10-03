import React, { useState } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { Search, FileText, Printer } from '../components/Icons';
import OfficialInvoiceModal from '../components/OfficialInvoiceModal';

interface InvoicesProps {
  invoices: Invoice[];
}

const Invoices: React.FC<InvoicesProps> = ({ invoices }) => {
  const [view, setView] = useState<'list' | 'view'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(inv => 
    inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSales = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalUnits = invoices.reduce((sum, inv) => 
    sum + (inv.items || []).reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0), 0
  );

  if (view === 'view' && selectedInvoice) {
    return (
      <div className="space-y-6 flex flex-col h-full animate-fade-in">
        <div className="flex justify-between items-center shrink-0">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">تفاصيل الفاتورة #{selectedInvoice.id}</h2>
          <button 
            onClick={() => {
              setView('list');
              setSelectedInvoice(null);
            }}
            className="text-gray-500 hover:text-gray-800 transition-colors bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm"
          >
            عودة للقائمة
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between border-b border-gray-100 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 font-bold text-xl text-brand-blue mb-1">
                <span className="w-2 h-6 bg-brand-yellow rounded-full"></span>
                ابن السنوسي للطاقة
              </div>
              <p className="text-gray-500 text-sm">فاتورة ضريبية مبسطة</p>
            </div>
            <div className="text-right mt-4 md:mt-0">
              <p className="text-gray-500 text-sm mb-1">التاريخ والوقت</p>
              <p className="font-bold text-gray-800">{selectedInvoice.date} {selectedInvoice.time && `- ${selectedInvoice.time}`}</p>
              {selectedInvoice.employeeName && (
                <p className="text-gray-500 text-sm mt-2">الموظف: {selectedInvoice.employeeName}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between mb-8 bg-gray-50 p-4 rounded-xl">
            <div>
              <p className="text-gray-500 text-sm mb-1">بيانات العميل</p>
              <p className="font-bold text-gray-800 text-lg">{selectedInvoice.customerName || 'عميل نقدي'}</p>
            </div>
            {selectedInvoice.employeeName && (
              <div className="mt-4 md:mt-0">
                <p className="text-gray-500 text-sm mb-1">الموظف المسؤول (الكاشير)</p>
                <p className="font-bold text-gray-800 text-lg">{selectedInvoice.employeeName}</p>
              </div>
            )}
            <div className="text-right mt-4 md:mt-0">
              <p className="text-gray-500 text-sm mb-1">حالة الفاتورة</p>
              <span className={`px-3 py-1 rounded-full text-sm font-bold inline-block
                ${selectedInvoice.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-700' : 
                  selectedInvoice.status === InvoiceStatus.PARTIAL ? 'bg-yellow-100 text-yellow-700' : 
                  selectedInvoice.status === InvoiceStatus.PENDING ? 'bg-orange-100 text-orange-700' : 
                  'bg-gray-100 text-gray-700'}`}>
                {selectedInvoice.status}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto mb-8">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-bold">المنتج</th>
                  <th className="px-4 py-3 font-bold text-center">الكمية</th>
                  <th className="px-4 py-3 font-bold">سعر الوحدة</th>
                  <th className="px-4 py-3 font-bold">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedInvoice.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-4">
                      <p className="font-bold text-gray-800">{item.productName}</p>
                      {item.serialNumbers && item.serialNumbers.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1 font-mono">SN: {item.serialNumbers.join(', ')}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-gray-700">{item.quantity}</td>
                    <td className="px-4 py-4 text-gray-600">{item.price.toLocaleString()} ج.س</td>
                    <td className="px-4 py-4 font-bold text-gray-800">{item.total.toLocaleString()} ج.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full md:w-1/3 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>المجموع الفرعي</span>
                <span>{selectedInvoice.subtotal.toLocaleString()} ج.س</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>الضريبة (15%)</span>
                <span>{selectedInvoice.tax.toLocaleString()} ج.س</span>
              </div>
              {selectedInvoice.discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>الخصم</span>
                  <span>-{selectedInvoice.discount.toLocaleString()} ج.س</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                <span>الإجمالي</span>
                <span>{selectedInvoice.total.toLocaleString()} ج.س</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-3 w-full justify-end">
             <button 
               onClick={() => setShowOfficialModal(true)} 
               className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
             >
               <Printer className="w-4 h-4" />
               <span>معاينة وطباعة الفاتورة الرسمية (الورق المروس)</span>
             </button>
             <button 
               onClick={() => window.print()} 
               className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
             >
               طباعة سريعة
             </button>
          </div>
        </div>

        {/* Official Letterhead Invoice Modal */}
        <OfficialInvoiceModal
          invoice={selectedInvoice}
          isOpen={showOfficialModal}
          onClose={() => setShowOfficialModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">قائمة المبيعات وسجل الفواتير</h2>
          <p className="text-gray-500 text-sm">متابعة الفواتير المحفوظة والمبالغ المحصلة والكميات المباعة</p>
        </div>
      </div>

      {/* Sales Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">إجمالي المبيعات المحققة</p>
          <p className="text-2xl font-bold text-emerald-600 font-mono">{totalSales.toLocaleString()} <span className="text-xs font-sans">ج.س</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">إجمالي الفواتير الصادرة</p>
          <p className="text-2xl font-bold text-brand-blue font-mono">{invoices.length} <span className="text-xs font-sans text-gray-400">فاتورة</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">إجمالي الوحدات المباعة</p>
          <p className="text-2xl font-bold text-purple-600 font-mono">{totalUnits.toLocaleString()} <span className="text-xs font-sans text-gray-400">قطعة</span></p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="بحث برقم الفاتورة أو اسم العميل..."
            className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[800px] text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold">رقم الفاتورة</th>
                <th className="px-6 py-4 font-bold">العميل</th>
                <th className="px-6 py-4 font-bold">الموظف</th>
                <th className="px-6 py-4 font-bold">التاريخ والوقت</th>
                <th className="px-6 py-4 font-bold text-center">الكمية المباعة</th>
                <th className="px-6 py-4 font-bold">المبلغ الإجمالي</th>
                <th className="px-6 py-4 font-bold">الحالة</th>
                <th className="px-6 py-4 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => {
                const invoiceUnitsCount = (inv.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
                return (
                  <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-brand-blue">#{inv.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">{inv.customerName || 'عميل نقدي'}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{inv.employeeName || '-'}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{inv.date} {inv.time && <span className="text-[10px] text-gray-400">({inv.time})</span>}</td>
                    <td className="px-6 py-4 text-center font-bold font-mono text-purple-700">{invoiceUnitsCount} قطعة</td>
                    <td className="px-6 py-4 font-bold font-mono text-gray-900 text-sm">{inv.total.toLocaleString()} ج.س</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap
                        ${inv.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-700' : 
                          inv.status === InvoiceStatus.PARTIAL ? 'bg-yellow-100 text-yellow-700' : 
                          inv.status === InvoiceStatus.PENDING ? 'bg-orange-100 text-orange-700' : 
                          'bg-gray-100 text-gray-700'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setView('view');
                        }}
                        className="text-brand-blue hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs" title="عرض التفاصيل">
                        <FileText className="w-4 h-4" />
                        <span>عرض التفاصيل</span>
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    لا توجد فواتير مبيعات مسجلة حتى الآن
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;