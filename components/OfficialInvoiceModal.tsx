import React, { useRef } from 'react';
import { Invoice } from '../types';
import { Printer, X, Plus, CheckCircle2 } from './Icons';
import { tafqeet } from '../utils/tafqeet';

interface OfficialInvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onNewSale?: () => void;
  isProforma?: boolean;
  onConvertToFinalSale?: (invoice: Invoice) => void;
}

const OfficialInvoiceModal: React.FC<OfficialInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onNewSale,
  isProforma = false,
  onConvertToFinalSale,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalUnits = (invoice.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const arabicTafqeet = tafqeet(invoice.total, 'جنيه');

  // QR Code details
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
    `شركة ابن السنوسي للطاقة\n${isProforma ? 'فاتورة مبدئية / عرض سعر' : 'فاتورة ضريبية رسمية'}\nرقم: ${invoice.id}\nالتاريخ: ${invoice.date} ${invoice.time || ''}\nالعميل: ${invoice.customerName}\nالإجمالي: ${invoice.total} ج.س`
  )}`;

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4 overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-fade-in flex flex-col max-h-[96vh]">
        {/* Top Action Toolbar (Hidden during print) */}
        <div className={`px-6 py-4 flex flex-wrap justify-between items-center gap-3 no-print shrink-0 border-b ${
          isProforma ? 'bg-amber-950 text-white border-amber-900' : 'bg-slate-900 text-white border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full animate-pulse ${isProforma ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>{isProforma ? 'معاينة الفاتورة المبدئية (عرض أسعار)' : 'معاينة الفاتورة الرسمية (الورق المروس)'}</span>
                {isProforma && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    غير مسجلة بالمبيعات
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-300">
                {isProforma 
                  ? 'جاهزة للطباعة أو الإرسال للعميل كعرض أسعار رسمي دون خصم من المخزون' 
                  : 'فاتورة بيع معتمدة ومحفوظة ضمن مبيعات المنظومة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isProforma && onConvertToFinalSale && (
              <button
                onClick={() => {
                  onConvertToFinalSale(invoice);
                  onClose();
                }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
                title="تحويل هذه الفاتورة المبدئية إلى بيع نهائي وخصمها من المخزون"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تحويل لبيع نهائي الآن</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className={`flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95 cursor-pointer ${
                isProforma 
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/30' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30'
              }`}
              title="إرسال الفاتورة إلى الطابعة المتصلة بالكمبيوتر"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة {isProforma ? 'الفاتورة المبدئية' : 'الفاتورة'}</span>
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
                <span>عملية جديدة</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
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
            {/* Top Ornamental Ribbon */}
            <div className={`absolute top-0 left-0 right-0 h-2.5 ${
              isProforma 
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600' 
                : 'bg-gradient-to-r from-brand-blue via-amber-400 to-brand-blue'
            }`}></div>

            {/* Proforma Watermark Notice */}
            {isProforma && (
              <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-center text-xs font-bold flex items-center justify-center gap-2">
                <span>⚠️</span>
                <span>فاتورة مبدئية / عرض أسعار رسمي - الأسعار سارية لمدة 7 أيام - لا تسجل كحركة بيع نهائية بالمخازن</span>
              </div>
            )}

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
                  <div className={`px-5 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm text-white ${
                    isProforma ? 'bg-amber-600' : 'bg-brand-blue'
                  }`}>
                    {isProforma ? 'فاتورة مبدئية / عرض أسعار' : 'فاتورة ضريبية رسمية'}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {isProforma ? 'PROFORMA INVOICE / QUOTATION' : 'TAX SALES INVOICE'}
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
                <span className="text-slate-400 block text-[10px] font-medium">رقم الوثيقة:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">#{invoice.id}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-medium">تاريخ وتوقيت الإصدار:</span>
                <span className="font-mono font-bold text-slate-800">{invoice.date} {invoice.time || ''}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-medium">اسم العميل / المستفيد:</span>
                <span className="font-bold text-brand-blue text-sm">{invoice.customerName || 'عميل نقدي / استفسار'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-medium">نوع المعاملة:</span>
                <span className={`font-bold px-2 py-0.5 rounded border inline-block ${
                  isProforma 
                    ? 'text-amber-800 bg-amber-50 border-amber-300' 
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}>
                  {isProforma ? 'عرض أسعار مبدئي' : (invoice.paymentMethod || 'نقداً')}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-medium">الموظف / المسؤول:</span>
                <span className="font-medium text-slate-700">{invoice.employeeName || 'مسؤول المبيعات'}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-medium">حالة الوثيقة:</span>
                <span className="font-bold text-slate-800">{isProforma ? 'مبدئية (للمعاينة)' : invoice.status}</span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] font-medium">صلاحية العرض والضمان:</span>
                <span className="text-slate-600 text-[11px]">
                  {isProforma ? 'الأسعار سارية لمدة 7 أيام من تاريخه والضمان يسري بعد الشراء' : 'شامل الضمان المعتمد حسب شروط الوكالة المصنعة'}
                </span>
              </div>
            </div>

            {/* Table of Items (جدول الأصناف المباعة) */}
            <div className="my-6 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">بيان الصنف والوصف الفني</th>
                    <th className="py-2.5 px-3 w-20 text-center">الكمية</th>
                    <th className="py-2.5 px-3 w-28 text-left">سعر الوحدة</th>
                    <th className="py-2.5 px-3 w-28 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        {item.serialNumbers && item.serialNumbers.length > 0 && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            سيريال: {item.serialNumbers.join(' | ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 bg-slate-50">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-left font-mono font-medium text-slate-700" dir="ltr">
                        {item.price.toLocaleString()} ج.س
                      </td>
                      <td className="py-3 px-3 text-left font-mono font-bold text-brand-blue" dir="ltr">
                        {item.total.toLocaleString()} ج.س
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals and Tafqeet Section (ملخص المبالغ والتفقيط) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              {/* Right: Tafqeet & QR */}
              <div className="flex flex-col justify-between space-y-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-medium mb-1">المبلغ كتابةً وتفقيطاً:</span>
                  <p className="font-bold text-brand-blue text-xs leading-relaxed">
                    فقط {arabicTafqeet} لا غير.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200">
                  <img src={qrSvgUrl} alt="QR Code" className="w-14 h-14 shrink-0 rounded" />
                  <div className="text-[10px] text-slate-500 leading-tight">
                    <p className="font-bold text-slate-700">رمز التحقق الإلكتروني</p>
                    <p className="text-[9px] text-slate-400">يمكن مسح الكود للتحقق من تفاصيل الوثيقة</p>
                  </div>
                </div>
              </div>

              {/* Left: Summary Calculations */}
              <div className="space-y-1.5 bg-white p-3.5 rounded-lg border border-slate-200">
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
                    <span>ضريبة القيمة المضافة:</span>
                    <span className="font-mono font-bold">+{invoice.tax.toLocaleString()} ج.س</span>
                  </div>
                )}

                {/* Grand Total Highlight Box */}
                <div className={`flex justify-between items-center text-sm font-black p-2.5 rounded-lg border mt-2 ${
                  isProforma 
                    ? 'text-amber-900 bg-amber-50 border-amber-300' 
                    : 'text-brand-blue bg-brand-blue/10 border-brand-blue/20'
                }`}>
                  <span>{isProforma ? 'إجمالي عرض السعر المبدئي:' : 'المبلغ الإجمالي النهائي:'}</span>
                  <span className="font-mono text-base">{invoice.total.toLocaleString()} ج.س</span>
                </div>

                {!isProforma && (
                  <>
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
                  </>
                )}
              </div>
            </div>

            {/* Official Stamp & Signatures Area */}
            <div className="grid grid-cols-2 gap-8 my-8 pt-6 border-t-2 border-slate-200 text-xs">
              <div className="text-center space-y-8">
                <p className="font-bold text-slate-700">{isProforma ? 'موافقة العميل على العرض' : 'توقيع المستلم / العميل'}</p>
                <div className="w-48 border-b-2 border-dashed border-slate-300 mx-auto"></div>
                <p className="text-[10px] text-slate-400">
                  {isProforma ? 'اعتماد موافقة العميل على الأسعار المذكورة' : 'استلمت الأصناف الموضحة أعلاه بحالة سليمة'}
                </p>
              </div>

              <div className="text-center space-y-2 relative flex flex-col items-center">
                <p className="font-bold text-brand-blue">ختم وتوقيع الشركة المعتمد</p>
                
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

            {/* Official Terms & Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 text-center space-y-1">
              <p className="font-medium text-slate-600">
                • البضاعة المباعة تخضع للضمان المصنعي المعتمد • الاستبدال أو الاسترجاع وفق الشروط والمدة النظامية وبوجود الفاتورة الأصلية.
              </p>
              <p className="text-slate-400 font-mono">
                الخرطوم - السوق الشعبي / بورتسودان | هاتف: +249 912345678 | البريد: sales@ibnalsanusi.com
              </p>
            </div>

            {/* Bottom Ornamental Ribbon */}
            <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${
              isProforma 
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600' 
                : 'bg-gradient-to-r from-brand-blue via-amber-400 to-brand-blue'
            }`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialInvoiceModal;
