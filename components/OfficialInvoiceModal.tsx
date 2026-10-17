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

  // QR Code details (monochrome format)
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
    `ابن السنوسي للحلول المتكاملة\n${isProforma ? 'فاتورة مبدئية / عرض سعر' : 'فاتورة مبيعات رسمية'}\nرقم: ${invoice.id}\nالتاريخ: ${invoice.date} ${invoice.time || ''}\nالعميل: ${invoice.customerName}\nالإجمالي: ${invoice.total} ج.س\nالهاتف: +249900009596`
  )}`;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-start z-50 p-2 sm:p-4 overflow-y-auto invoice-modal-overlay">
      {/* Embedded Print & A4 Pagination Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
            width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
          .invoice-modal-overlay {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
            height: auto !important;
          }
          .invoice-modal-content {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            max-height: none !important;
            max-width: 100% !important;
            width: 100% !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .invoice-modal-scroll {
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            height: auto !important;
            display: block !important;
          }
          #official-print-invoice {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .avoid-page-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Main Modal Card */}
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-fade-in flex flex-col max-h-[96vh] invoice-modal-content">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="px-6 py-4 flex flex-wrap justify-between items-center gap-3 no-print shrink-0 border-b bg-slate-900 text-white border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${isProforma ? 'bg-slate-400' : 'bg-emerald-400'}`}></span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>{isProforma ? 'معاينة الفاتورة المبدئية (عرض أسعار)' : 'معاينة الفاتورة الرسمية النهائية'}</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                  {isProforma ? 'فاتورة مبدئية' : 'فاتورة نهائية'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isProforma 
                  ? 'تنسيق قياسي أبيض ورمادي جاهز للطباعة على ورق A4 (عرض أسعار مبدئي)' 
                  : 'تنسيق قياسي أبيض ورمادي جاهز للطباعة على ورق A4 (فاتورة مبيعات نهائية)'}
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
                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-slate-600 transition-all active:scale-95 cursor-pointer shadow-sm"
                title="تحويل هذه الفاتورة المبدئية إلى بيع نهائي وخصمها من المخزون"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تحويل لبيع نهائي</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-slate-600 transition-all active:scale-95 cursor-pointer shadow-md"
              title="طباعة الفاتورة على ورق A4"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الفاتورة (A4)</span>
            </button>

            {onNewSale && (
              <button
                onClick={() => {
                  onClose();
                  onNewSale();
                }}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border border-slate-700 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>عملية جديدة</span>
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

        {/* Scrollable Preview Area */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-200/50 custom-scrollbar flex-1 flex justify-center invoice-modal-scroll">
          
          {/* THE A4 PRINTABLE INVOICE SHEET (تصميم الفاتورة باللونين الأبيض والرمادي متوافق مع ورق A4) */}
          <div 
            id="official-print-invoice"
            ref={printRef}
            className="bg-white w-full max-w-[210mm] shadow-xl rounded-xl border border-slate-300 p-6 sm:p-10 text-slate-900 relative"
            style={{ 
              minHeight: '297mm',
              boxSizing: 'border-box'
            }}
          >
            {/* Top Border Bar (رمادي كلاسيكي راقي) */}
            <div className="border-t-4 border-slate-800 -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 mb-6 sm:mb-8"></div>

            {/* Proforma Notice Banner (أبيض ورمادي) */}
            {isProforma && (
              <div className="mb-6 p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-center text-xs font-bold flex items-center justify-center gap-2">
                <span>📋</span>
                <span>فاتورة مبدئية / عرض أسعار رسمي - صالحة لمدة 7 أيام - لا تسجل كحركة بيع نهائية بالمخازن</span>
              </div>
            )}

            {/* Official Header (ترويسة الشركة باللونين الأبيض والرمادي) */}
            <div className="pb-6 border-b-2 border-slate-300">
              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 text-center sm:text-right">
                
                {/* Branding with Logo */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-slate-300 shadow-sm p-1.5 flex items-center justify-center shrink-0">
                    <img 
                      src="/Logo.png" 
                      alt="ابن السنوسي للحلول المتكاملة" 
                      className="w-full h-full object-contain grayscale"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      ابن السنوسي للحلول المتكاملة
                    </h1>
                    <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">
                      حلول الطاقة الشمسية والأنظمة الكهربائية والتقنية المتقدمة
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                      📍 الخرطوم بحري كوبر شرق كبري الخرطوم كوبر | 📞 +249900009596
                    </p>
                  </div>
                </div>

                {/* Document Type Badge & Number */}
                <div className="text-center sm:text-left flex flex-col items-center sm:items-end">
                  <div className="px-5 py-2 rounded-xl text-xs sm:text-sm font-black border-2 border-slate-800 bg-slate-100 text-slate-900 shadow-sm">
                    {isProforma ? 'فاتورة مبدئية / عرض أسعار' : 'فاتورة مبيعات رسمية'}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 font-mono">
                    {isProforma ? 'PROFORMA INVOICE / QUOTATION' : 'OFFICIAL SALES INVOICE'}
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-1.5 bg-slate-100 px-3 py-1 rounded-lg border border-slate-300">
                    رقم الوثيقة: #{invoice.id}
                  </div>
                </div>
              </div>

              {/* Clean Gray Divider */}
              <div className="mt-5 h-0.5 bg-slate-300 w-full"></div>
            </div>

            {/* Invoice Meta Grid (بيانات الفاتورة والعميل) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">رقم الفاتورة:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">#{invoice.id}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] font-bold">التاريخ والتوقيت:</span>
                <span className="font-mono font-bold text-slate-900">{invoice.date} {invoice.time || ''}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] font-bold">اسم العميل:</span>
                <span className="font-bold text-slate-900 text-sm">{invoice.customerName || 'عميل نقدي'}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] font-bold">نوع المعاملة وطريقة السداد:</span>
                <span className="font-bold text-slate-900 px-2 py-0.5 rounded border border-slate-300 bg-white inline-block">
                  {isProforma ? 'عرض أسعار مبدئي' : (invoice.paymentMethod || 'نقداً')}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] font-bold">الموظف المسؤول (الكاشير):</span>
                <span className="font-bold text-slate-800">{invoice.employeeName || 'مسؤول المبيعات'}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] font-bold">حالة السداد:</span>
                <span className="font-bold text-slate-900">{isProforma ? 'مبدئي (غير معتمد بعد)' : invoice.status}</span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px] font-bold">ملاحظات والصلاحية:</span>
                <span className="text-slate-700 text-[11px] font-medium">
                  {isProforma ? 'الأسعار سارية لمدة 7 أيام عمل - تخضع لتوافر المخزون عند التعميد' : (invoice.notes || 'البضاعة المباعة تخضع للضمان المصنعي المعتمد')}
                </span>
              </div>
            </div>

            {/* Table of Items (جدول الأصناف - يتناسق تلقائياً مع حجم صفحات A4) */}
            <div className="my-6 rounded-xl border border-slate-300 overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-400">
                    <th className="py-2.5 px-3 w-10 text-center border-l border-slate-300">#</th>
                    <th className="py-2.5 px-3 border-l border-slate-300">بيان الصنف والمواصفات</th>
                    <th className="py-2.5 px-3 w-20 text-center border-l border-slate-300">الكمية</th>
                    <th className="py-2.5 px-3 w-28 text-left border-l border-slate-300">سعر الوحدة</th>
                    <th className="py-2.5 px-3 w-28 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-500 border-l border-slate-200">{idx + 1}</td>
                      <td className="py-3 px-3 border-l border-slate-200">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        {item.serialNumbers && item.serialNumbers.length > 0 && (
                          <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                            سيريال: {item.serialNumbers.join(' | ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 bg-slate-50/40 border-l border-slate-200">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-left font-mono font-medium text-slate-800 border-l border-slate-200" dir="ltr">
                        {item.price.toLocaleString()} ج.س
                      </td>
                      <td className="py-3 px-3 text-left font-mono font-bold text-slate-900" dir="ltr">
                        {item.total.toLocaleString()} ج.س
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals and Tafqeet Section (ملخص المبالغ والتفقيط - أبيض ورمادي محكم) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 p-4 rounded-xl bg-slate-50 border border-slate-300 text-xs avoid-page-break">
              
              {/* Right: Tafqeet & QR */}
              <div className="flex flex-col justify-between space-y-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold mb-1">المبلغ كتابةً وتفقيطاً:</span>
                  <p className="font-bold text-slate-900 text-xs leading-relaxed">
                    فقط {arabicTafqeet} لا غير.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                  <img src={qrSvgUrl} alt="QR Code" className="w-14 h-14 shrink-0 rounded border border-slate-200 grayscale" />
                  <div className="text-[10px] text-slate-600 leading-tight">
                    <p className="font-bold text-slate-900">ابن السنوسي للحلول المتكاملة</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">هاتف: +249900009596</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">الخرطوم بحري كوبر</p>
                  </div>
                </div>
              </div>

              {/* Left: Summary Calculations */}
              <div className="space-y-1.5 bg-white p-3.5 rounded-lg border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي ({totalUnits} قطع):</span>
                  <span className="font-mono font-bold text-slate-900">{invoice.subtotal.toLocaleString()} ج.س</span>
                </div>

                {invoice.discount > 0 && (
                  <div className="flex justify-between text-slate-700 font-medium">
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

                {/* Grand Total Highlight Box (أبيض ورمادي أنيق) */}
                <div className="flex justify-between items-center text-sm font-black p-2.5 rounded-lg border-2 border-slate-800 bg-slate-100 text-slate-900 mt-2">
                  <span>{isProforma ? 'إجمالي الفاتورة المبدئية:' : 'المبلغ الإجمالي النهائي:'}</span>
                  <span className="font-mono text-base">{invoice.total.toLocaleString()} ج.س</span>
                </div>

                {!isProforma && (
                  <>
                    <div className="flex justify-between text-slate-700 pt-1 text-[11px]">
                      <span>المبلغ المدفوع:</span>
                      <span className="font-mono font-bold text-slate-900">{(invoice.paidAmount || invoice.total).toLocaleString()} ج.س</span>
                    </div>

                    {invoice.total > (invoice.paidAmount || invoice.total) && (
                      <div className="flex justify-between text-slate-900 font-bold text-[11px] bg-slate-100 p-1.5 rounded border border-slate-300">
                        <span>المتبقي ذمم / آجل:</span>
                        <span className="font-mono">{(invoice.total - (invoice.paidAmount || 0)).toLocaleString()} ج.س</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Official Stamp & Signatures Area (موضع الختم: الختم فقط) */}
            <div className="grid grid-cols-2 gap-8 my-8 pt-6 border-t-2 border-slate-300 text-xs avoid-page-break">
              
              {/* جهة توقيع العميل / المستلم */}
              <div className="text-center space-y-6">
                <p className="font-bold text-slate-800">{isProforma ? 'موافقة واعتماد العميل' : 'توقيع المستلم / العميل'}</p>
                <div className="w-48 border-b-2 border-dashed border-slate-400 mx-auto pt-10"></div>
                <p className="text-[10px] text-slate-500">
                  {isProforma ? 'اعتماد العميل للموافقة على الأسعار' : 'استلمت البضاعة بحالة سليمة ومطابقة للمواصفات'}
                </p>
              </div>

              {/* جهة ختم واعتماد الشركة - موضع الختم: الختم فقط */}
              <div className="text-center space-y-3 relative flex flex-col items-center">
                <p className="font-bold text-slate-900">اعتماد إدارة الشركة</p>
                
                {/* موضع الختم: مكتوب داخله "الختم" فقط كما طُلب بدقة */}
                <div className="w-36 h-28 rounded-2xl border-2 border-dashed border-slate-400 bg-slate-50/70 flex items-center justify-center my-1">
                  <span className="text-sm font-bold text-slate-500 tracking-widest">الختم</span>
                </div>

                <div className="w-48 border-b border-slate-300 mx-auto pt-1"></div>
                <p className="text-[10px] text-slate-500">توقيع المسؤول المعتمد</p>
              </div>
            </div>

            {/* Footer with company details and terms */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 text-center space-y-1 avoid-page-break">
              <p className="font-bold text-slate-700">
                ابن السنوسي للحلول المتكاملة • هاتف: +249900009596
              </p>
              <p className="text-slate-500 font-medium">
                العنوان: الخرطوم بحري كوبر شرق كبري الخرطوم كوبر
              </p>
              <p className="text-slate-400 text-[9px] mt-0.5">
                • البضاعة المباعة تخضع للضمان المصنعي المعتمد • الفاتورة المبدئية غير ملزمة وصالحة لمدة 7 أيام عمل
              </p>
            </div>

            {/* Bottom Border Accent (رمادي) */}
            <div className="border-b-4 border-slate-800 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 mt-6 sm:mt-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialInvoiceModal;
