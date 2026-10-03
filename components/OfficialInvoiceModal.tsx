import React, { useRef } from 'react';
import { Invoice } from '../types';
import { Printer, X, Plus, CheckCircle2, Download } from './Icons';
import { tafqeet } from '../utils/tafqeet';

interface OfficialInvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onNewSale?: () => void;
}

const OfficialInvoiceModal: React.FC<OfficialInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onNewSale,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalUnits = (invoice.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const arabicTafqeet = tafqeet(invoice.total, 'جنيه');

  // Simple QR code simulation SVG encoding invoice details
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
    `ابن السنوسي للطاقة الشمسية\nفاتورة رقم: ${invoice.id}\nالتاريخ: ${invoice.date} ${invoice.time || ''}\nالعميل: ${invoice.customerName}\nالإجمالي: ${invoice.total} ج.س\nالضريبة: ${invoice.tax} ج.س`
  )}`;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4 overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-fade-in flex flex-col max-h-[96vh]">
        {/* Top Action Toolbar (Hidden during print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap justify-between items-center gap-3 no-print shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">معاينة الفاتورة الرسمية (الورق المروس)</h3>
              <p className="text-[11px] text-slate-400">فاتورة بيع جاهزة للإرسال إلى الطابعة المتصلة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer"
              title="إرسال الفاتورة إلى الطابعة المتصلة بالكمبيوتر"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الفاتورة (الطابعة)</span>
            </button>

            {onNewSale && (
              <button
                onClick={() => {
                  onClose();
                  onNewSale();
                }}
                className="flex items-center gap-1.5 bg-brand-blue hover:bg-blue-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>بيع جديد</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Area */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100/60 custom-scrollbar flex-1 flex justify-center">
          {/* THE OFFICIAL LETTERHEAD SHEET (الورق المروس) */}
          <div 
            id="official-print-invoice"
            ref={printRef}
            className="bg-white w-full max-w-[800px] shadow-lg rounded-2xl border border-slate-200/80 p-6 sm:p-10 text-slate-800 relative overflow-hidden"
            style={{ minHeight: '1050px' }}
          >
            {/* Top Ornamental Ribbon (Decorative Header Border) */}
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-brand-blue via-amber-400 to-brand-blue"></div>

            {/* Official Letterhead Header (ترويسة الشركة الرسمية) */}
            <div className="pb-6 border-b-2 border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-right">
                {/* Right: Arabic Branding */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-slate-100 shadow-md p-1.5 flex items-center justify-center shrink-0">
                    <img 
                      src="/Logo.png" 
                      alt="ابن السنوسي للطاقة الشمسية" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-brand-blue tracking-tight">
                      شركة ابن السنوسي
                    </h1>
                    <p className="text-xs sm:text-sm font-bold text-amber-600">
                      لحلول الطاقة الشمسية والأنظمة الكهربائية المعتمدة
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      س.ت: 1010892341 | الرقم الضريبي: 310294857200003
                    </p>
                  </div>
                </div>

                {/* Left: Document Title Badge */}
                <div className="text-center sm:text-left flex flex-col items-center sm:items-end">
                  <div className="bg-brand-blue text-white px-5 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm">
                    فاتورة ضريبية رسمية
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    TAX SALES INVOICE
                  </span>
                  <div className="text-xs font-mono font-bold text-brand-blue mt-1">
                    #{invoice.id}
                  </div>
                </div>
              </div>

              {/* Gold/Navy Separator Accent */}
              <div className="mt-4 flex items-center gap-2">
                <div className="h-0.5 bg-brand-blue flex-1"></div>
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <div className="h-0.5 bg-amber-400 w-16"></div>
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <div className="h-0.5 bg-brand-blue flex-1"></div>
              </div>
            </div>

            {/* Invoice Meta Grid (بيانات الفاتورة والعميل) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">رقم الفاتورة:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">#{invoice.id}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-medium">تاريخ وتوقيت البيع:</span>
                <span className="font-mono font-bold text-slate-800">{invoice.date} {invoice.time || ''}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-medium">اسم العميل:</span>
                <span className="font-bold text-brand-blue text-sm">{invoice.customerName || 'عميل نقدي'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-medium">طريقة الدفع:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                  {invoice.paymentMethod || 'نقداً'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-medium">الكاشير / الموظف:</span>
                <span className="font-medium text-slate-700">{invoice.employeeName || 'كاشير الفرع'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-medium">حالة السداد:</span>
                <span className="font-bold text-slate-800">{invoice.status}</span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] font-medium">الضمان والصيانة:</span>
                <span className="text-slate-600 text-[11px]">شامل الضمان المعتمد حسب شروط الوكالة المصنعة</span>
              </div>
            </div>

            {/* Items Table (جدول الأصناف المباعة) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm my-6">
              <table className="w-full text-right text-xs">
                <thead className="bg-brand-blue text-white font-bold border-b border-blue-900">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-4">بيان الصنف والمنتج</th>
                    <th className="py-3 px-3 text-center w-24">الكمية</th>
                    <th className="py-3 px-4 text-left w-32">سعر الوحدة</th>
                    <th className="py-3 px-4 text-left w-36">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="text-xs sm:text-sm">{item.productName}</div>
                        {item.serialNumbers && item.serialNumbers.length > 0 && (
                          <div className="text-[10px] text-purple-700 font-mono mt-0.5 flex flex-wrap gap-1">
                            <span className="font-sans font-bold">الأرقام التسلسلية (S/N):</span>
                            <span>{item.serialNumbers.join(' , ')}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono text-slate-900 text-sm">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-left font-mono text-slate-700 font-medium">
                        {item.price.toLocaleString()} ج.س
                      </td>
                      <td className="py-3 px-4 text-left font-mono font-bold text-slate-900 text-sm">
                        {item.total.toLocaleString()} ج.س
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Tafqeet & QR Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6 pt-2">
              {/* Right: QR Code & Arabic Words Tafqeet (Cols 7 of 12) */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                {/* Written amount in Arabic (التفقيط الرسمي) */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-800 block mb-0.5">المبلغ الإجمالي كتابةً:</span>
                  <p className="font-bold text-slate-800 text-xs sm:text-sm leading-relaxed">
                    {arabicTafqeet}
                  </p>
                </div>

                {/* QR Code and verification info */}
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-200 shrink-0 flex items-center justify-center">
                    <img 
                      src={qrSvgUrl} 
                      alt="رمز التحقق الإلكتروني للفاتورة" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <p className="font-bold text-brand-blue flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>فاتورة إلكترونية معتمدة ونظامية</span>
                    </p>
                    <p className="text-slate-500">تم تسجيل العملية وخصم البضاعة من المستودع المركزي</p>
                    <p className="text-[10px] text-slate-400 font-mono">رمز الفاتورة: {invoice.id}</p>
                  </div>
                </div>
              </div>

              {/* Left: Financial Breakdown (Cols 5 of 12) */}
              <div className="md:col-span-5 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي ({totalUnits} قطع):</span>
                  <span className="font-mono font-bold text-slate-800">{invoice.subtotal.toLocaleString()} ج.س</span>
                </div>

                {invoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>الخصم الممنوح:</span>
                    <span className="font-mono font-bold">-{invoice.discount.toLocaleString()} ج.س</span>
                  </div>
                )}

                {invoice.tax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span className="font-mono font-bold">+{invoice.tax.toLocaleString()} ج.س</span>
                  </div>
                )}

                {/* Grand Total Highlight Box */}
                <div className="flex justify-between items-center text-sm font-black text-brand-blue p-2.5 bg-brand-blue/10 rounded-lg border border-brand-blue/20 mt-2">
                  <span>المبلغ الإجمالي النهائي:</span>
                  <span className="font-mono text-base">{invoice.total.toLocaleString()} ج.س</span>
                </div>

                <div className="flex justify-between text-slate-600 pt-1 text-[11px]">
                  <span>المبلغ المدفوع:</span>
                  <span className="font-mono font-bold text-emerald-700">{(invoice.paidAmount || invoice.total).toLocaleString()} ج.س</span>
                </div>

                {invoice.total > (invoice.paidAmount || invoice.total) && (
                  <div className="flex justify-between text-rose-600 font-bold text-[11px] bg-rose-50 p-1.5 rounded border border-rose-200">
                    <span>المتبقي ذمم / آجل:</span>
                    <span className="font-mono">{(invoice.total - (invoice.paidAmount || 0)).toLocaleString()} ج.س</span>
                  </div>
                )}
              </div>
            </div>

            {/* Official Stamp & Signatures Area (ختم وتوقيع الشركة) */}
            <div className="grid grid-cols-2 gap-8 my-8 pt-6 border-t-2 border-slate-200 text-xs">
              {/* Customer Acceptance */}
              <div className="text-center space-y-8">
                <p className="font-bold text-slate-700">توقيع المستلم / العميل</p>
                <div className="w-48 border-b-2 border-dashed border-slate-300 mx-auto"></div>
                <p className="text-[10px] text-slate-400">استلمت الأصناف الموضحة أعلاه بحالة سليمة</p>
              </div>

              {/* Official Seal and Stamp */}
              <div className="text-center space-y-2 relative flex flex-col items-center">
                <p className="font-bold text-brand-blue">ختم وتوقيع الشركة المعتمد</p>
                
                {/* Stylized Official Circular Stamp (ختم الشركة الرسمي) */}
                <div className="w-24 h-24 rounded-full border-2 border-brand-blue/60 p-1 flex items-center justify-center relative rotate-[-6deg] opacity-90">
                  <div className="w-full h-full rounded-full border border-dashed border-brand-blue flex flex-col items-center justify-center p-1 bg-blue-50/20">
                    <span className="text-[8px] font-bold text-brand-blue">شركة ابن السنوسي</span>
                    <span className="text-[10px] font-black text-amber-600">★ معتمد ★</span>
                    <span className="text-[7px] text-slate-500 font-mono">قسم المبيعات</span>
                  </div>
                </div>

                <div className="w-48 border-b-2 border-slate-300 mx-auto"></div>
              </div>
            </div>

            {/* Official Terms & Footer (شروط الضمان وتذييل الفاتورة) */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 text-center space-y-1">
              <p className="font-medium text-slate-600">
                • البضاعة المباعة تخضع للضمان المصنعي المعتمد • الاستبدال أو الاسترجاع وفق الشروط والمدة النظامية وبوجود الفاتورة الأصلية.
              </p>
              <p className="text-slate-400 font-mono">
                الخرطوم - السوق الشعبي / بورتسودان | هاتف: +249 912345678 | البريد: sales@ibnalsanusi.com
              </p>
            </div>

            {/* Bottom Ornamental Ribbon */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-blue via-amber-400 to-brand-blue"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialInvoiceModal;
