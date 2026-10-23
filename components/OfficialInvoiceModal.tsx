import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
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

// Exact Brand Colors extracted directly from public/Logo.png
const LOGO_BLUE = '#281F6E';       // Royal Deep Indigo/Navy from Logo
const LOGO_YELLOW = '#FEED01';     // Exact Solar Yellow from Logo
const LOGO_GOLD_ACCENT = '#DEA61B'; // Warm supporting gold/amber accent from Logo

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

  const items = invoice.items || [];
  const totalUnits = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const arabicTafqeet = tafqeet(invoice.total, 'جنيه');

  // QR Code details
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
    `ابن السنوسي للحلول المتكاملة\n${isProforma ? 'فاتورة مبدئية / عرض أسعار' : 'فاتورة مبيعات رسمية'}\nرقم: ${invoice.id}\nالتاريخ: ${invoice.date} ${invoice.time || ''}\nالعميل: ${invoice.customerName}\nالإجمالي: ${invoice.total} ج.س\nالهاتف: +249900009596`
  )}`;

  // Multi-page A4 detection: when items count is high, notify user in UI that it will print cleanly across multiple pages
  const isMultiPageEstimated = items.length > 7;

  const modalContent = (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-start z-50 p-2 sm:p-4 overflow-y-auto invoice-modal-overlay">
      {/* Embedded Print & A4 Multi-page Pagination Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 12mm 12mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
            min-height: auto !important;
            width: 100% !important;
            font-size: 11pt !important;
          }
          /* CRITICAL: Hide the entire app UI and background elements when printing */
          #root, body > #root {
            display: none !important;
          }
          .no-print, header, aside, .sidebar {
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
            min-height: auto !important;
          }
          .invoice-modal-content {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            max-height: none !important;
            height: auto !important;
            min-height: auto !important;
            max-width: 100% !important;
            width: 100% !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .invoice-modal-scroll {
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            height: auto !important;
            min-height: auto !important;
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
            height: auto !important;
            background: #ffffff !important;
            display: block !important;
          }
          .print-header-bar {
            margin-left: 0 !important;
            margin-right: 0 !important;
            margin-top: 0 !important;
            margin-bottom: 15px !important;
          }
          .print-footer-bar {
            margin-left: 0 !important;
            margin-right: 0 !important;
            margin-bottom: 0 !important;
            margin-top: 15px !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          thead {
            display: table-header-group !important; /* Repeats table header on page 2+ */
          }
          tfoot {
            display: table-footer-group !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          td, th {
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
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-fade-in flex flex-col max-h-[96vh] invoice-modal-content border border-slate-300">
        
        {/* Top Control Bar (Hidden on print) - Styled with Logo Colors */}
        <div 
          className="px-5 py-3.5 flex flex-wrap justify-between items-center gap-3 no-print shrink-0 border-b text-white"
          style={{ backgroundColor: '#1B144B', borderBottomColor: 'rgba(254, 237, 1, 0.25)' }}
        >
          <div className="flex items-center gap-2.5">
            <span 
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: LOGO_YELLOW }}
            ></span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {isProforma ? 'معاينة الفاتورة المبدئية (عرض أسعار)' : 'معاينة الفاتورة الرسمية النهائية'}
                </h3>
                <span 
                  className="text-[10px] px-2.5 py-0.5 rounded font-black shadow-xs"
                  style={{
                    backgroundColor: isProforma ? LOGO_YELLOW : 'rgba(254, 237, 1, 0.15)',
                    color: isProforma ? '#1B144B' : LOGO_YELLOW,
                    border: `1px solid ${isProforma ? LOGO_GOLD_ACCENT : 'rgba(254, 237, 1, 0.4)'}`
                  }}
                >
                  {isProforma ? 'فاتورة مبدئية' : 'فاتورة نهائية'}
                </span>
                {isMultiPageEstimated && (
                  <span 
                    className="text-[10px] px-2 py-0.5 rounded font-bold"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: LOGO_YELLOW, border: `1px solid ${LOGO_GOLD_ACCENT}` }}
                  >
                    متعدد الصفحات تلقائياً (A4)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                تنسيق رسمي بألوان الشعار الأصلية (الأصفر الشمسي والأزرق الكحلي) - جاهز للطباعة على ورق A4
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
                className="flex items-center gap-1.5 text-white px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-sm hover:brightness-110"
                style={{ backgroundColor: LOGO_BLUE, border: `1px solid ${LOGO_GOLD_ACCENT}` }}
                title="تحويل هذه الفاتورة المبدئية إلى بيع نهائي وخصمها من المخزون"
              >
                <CheckCircle2 className="w-4 h-4" style={{ color: LOGO_YELLOW }} />
                <span>تحويل لبيع نهائي</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-black text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-md hover:brightness-95"
              style={{ backgroundColor: LOGO_YELLOW, color: '#1B144B', border: `1px solid ${LOGO_GOLD_ACCENT}` }}
              title="طباعة الفاتورة على ورق A4"
            >
              <Printer className="w-4 h-4" style={{ color: '#1B144B' }} />
              <span>طباعة الفاتورة (A4)</span>
            </button>

            {onNewSale && (
              <button
                onClick={() => {
                  onClose();
                  onNewSale();
                }}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all border border-slate-700 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>عملية جديدة</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-100 custom-scrollbar flex-1 flex justify-center invoice-modal-scroll">
          
          {/* THE A4 PRINTABLE INVOICE SHEET (تصميم الفاتورة بألوان الشعار الأصلية: #281F6E و #FEED01) */}
          <div 
            id="official-print-invoice"
            ref={printRef}
            className="bg-white w-full max-w-[210mm] shadow-md border border-slate-300 p-6 sm:p-8 text-slate-900 relative"
            style={{ 
              minHeight: isMultiPageEstimated ? 'auto' : '297mm',
              boxSizing: 'border-box'
            }}
          >
            {/* Top Corporate Accent Bar (الشريط العلوي المزدوج بلوني الشعار) */}
            <div className="flex h-2.5 w-full -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-5 print-header-bar overflow-hidden">
              <div className="h-full flex-1" style={{ backgroundColor: LOGO_BLUE }}></div>
              <div className="h-full w-28 sm:w-36" style={{ backgroundColor: LOGO_YELLOW }}></div>
            </div>

            {/* Proforma Notice Banner (أصفر وأزرق الشعار) */}
            {isProforma && (
              <div 
                className="mb-4 p-2.5 rounded-lg text-center text-xs font-bold flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: 'rgba(254, 237, 1, 0.15)', 
                  border: `1px solid ${LOGO_GOLD_ACCENT}`,
                  color: LOGO_BLUE 
                }}
              >
                <span>📋</span>
                <span>فاتورة مبدئية / عرض أسعار رسمي - صالحة لمدة 7 أيام - لا تسجل كحركة بيع نهائية بالمخازن</span>
              </div>
            )}

            {/* Official Header (ترويسة الشركة مع الشعار الأصلي وألوان الشعار الحقيقية) */}
            <div className="pb-4 border-b border-slate-200 avoid-page-break">
              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 text-center sm:text-right">
                
                {/* Branding with Company Logo in ORIGINAL COLORS */}
                <div className="flex items-center gap-3.5">
                  <div 
                    className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl bg-white shadow-xs p-1 flex items-center justify-center shrink-0"
                    style={{ border: `1.5px solid rgba(40, 31, 110, 0.2)` }}
                  >
                    <img 
                      src="/Logo.png" 
                      alt="ابن السنوسي للحلول المتكاملة" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 
                      className="text-xl sm:text-2xl font-black tracking-tight"
                      style={{ color: LOGO_BLUE }}
                    >
                      ابن السنوسي للحلول المتكاملة
                    </h1>
                    <p 
                      className="text-xs sm:text-sm font-bold mt-0.5 flex items-center gap-1.5 justify-center sm:justify-start"
                      style={{ color: '#8A6800' }}
                    >
                      <span 
                        className="inline-block w-2.5 h-2.5 rounded-full shadow-xs"
                        style={{ backgroundColor: LOGO_YELLOW, border: `1px solid ${LOGO_GOLD_ACCENT}` }}
                      ></span>
                      <span style={{ color: LOGO_BLUE }}>حلول الطاقة الشمسية والأنظمة الكهربائية والتقنية المتقدمة</span>
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                      📍 الخرطوم بحري كوبر شرق كبري الخرطوم كوبر | 📞 +249900009596
                    </p>
                  </div>
                </div>

                {/* Document Type Badge & Number (Logo Blue & Logo Yellow) */}
                <div className="text-center sm:text-left flex flex-col items-center sm:items-end">
                  <div 
                    className="px-4 py-1.5 rounded-lg text-xs sm:text-sm font-black shadow-xs"
                    style={
                      isProforma
                        ? { backgroundColor: LOGO_YELLOW, color: '#1B144B', border: `1.5px solid ${LOGO_GOLD_ACCENT}` }
                        : { backgroundColor: LOGO_BLUE, color: '#FFFFFF', border: `1.5px solid ${LOGO_BLUE}` }
                    }
                  >
                    {isProforma ? 'فاتورة مبدئية / عرض أسعار' : 'فاتورة مبيعات رسمية'}
                  </div>
                  <span 
                    className="text-[10px] font-bold uppercase tracking-widest mt-1 font-mono"
                    style={{ color: isProforma ? '#8A6800' : LOGO_BLUE }}
                  >
                    {isProforma ? 'PROFORMA INVOICE / QUOTATION' : 'OFFICIAL SALES INVOICE'}
                  </span>
                  <div 
                    className="text-xs font-mono font-bold mt-1 px-3 py-0.5 rounded shadow-2xs"
                    style={{ 
                      backgroundColor: 'rgba(254, 237, 1, 0.15)', 
                      color: LOGO_BLUE, 
                      border: `1px solid ${LOGO_GOLD_ACCENT}` 
                    }}
                  >
                    رقم الوثيقة: #{invoice.id}
                  </div>
                </div>
              </div>

              {/* Clean Accent Divider matching Logo Colors */}
              <div className="mt-4 flex items-center gap-1.5 w-full">
                <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: LOGO_BLUE }}></div>
                <div className="h-1 w-24 rounded-full" style={{ backgroundColor: LOGO_YELLOW }}></div>
              </div>
            </div>

            {/* Invoice Meta Grid (بيانات الفاتورة والعميل) */}
            <div 
              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 p-3 rounded-lg text-xs avoid-page-break"
              style={{ 
                backgroundColor: 'rgba(40, 31, 110, 0.02)', 
                border: '1px solid rgba(40, 31, 110, 0.12)' 
              }}
            >
              <div>
                <span className="block text-[10px] font-bold" style={{ color: LOGO_BLUE }}>رقم الفاتورة:</span>
                <span className="font-mono font-black text-sm" style={{ color: LOGO_BLUE }}>#{invoice.id}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold" style={{ color: LOGO_BLUE }}>التاريخ والتوقيت:</span>
                <span className="font-mono font-bold text-slate-900">{invoice.date} {invoice.time || ''}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold" style={{ color: LOGO_BLUE }}>اسم العميل:</span>
                <span className="font-black text-sm" style={{ color: LOGO_BLUE }}>{invoice.customerName || 'عميل نقدي'}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold" style={{ color: LOGO_BLUE }}>طريقة السداد:</span>
                <span 
                  className="font-bold px-2 py-0.5 rounded bg-white inline-block shadow-2xs"
                  style={{ color: LOGO_BLUE, border: `1px solid ${LOGO_GOLD_ACCENT}` }}
                >
                  {isProforma ? 'عرض أسعار مبدئي' : (invoice.paymentMethod || 'نقداً')}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold" style={{ color: LOGO_BLUE }}>الموظف المسؤول:</span>
                <span className="font-bold text-slate-800">{invoice.employeeName || 'مسؤول المبيعات'}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold" style={{ color: LOGO_BLUE }}>حالة الفاتورة:</span>
                <span className="font-bold text-slate-800">{isProforma ? 'مبدئي (عرض أسعار)' : invoice.status}</span>
              </div>

              <div className="col-span-2">
                <span className="block text-[10px] font-bold" style={{ color: LOGO_BLUE }}>ملاحظات وشروط:</span>
                <span className="text-slate-600 text-[11px] font-medium">
                  {isProforma 
                    ? 'الأسعار سارية لمدة 7 أيام عمل من تاريخه - تخضع لتوافر المخزون عند التعميد' 
                    : (invoice.notes || 'البضاعة المباعة تخضع للضمان المصنعي المعتمد وفق الشروط المنصوص عليها')}
                </span>
              </div>
            </div>

            {/* Table of Items (جدول الأصناف - كحلي الشعار مع خط أصفر الشعار الفاقع #FEED01) */}
            <div 
              className="my-4 rounded-lg overflow-hidden"
              style={{ border: `1.5px solid ${LOGO_BLUE}` }}
            >
              <table className="w-full text-right text-xs">
                <thead>
                  <tr 
                    className="text-white font-bold"
                    style={{ 
                      backgroundColor: LOGO_BLUE, 
                      borderBottom: `3px solid ${LOGO_YELLOW}` 
                    }}
                  >
                    <th className="py-2.5 px-3 w-10 text-center border-l border-white/20 text-white">#</th>
                    <th className="py-2.5 px-3 border-l border-white/20 text-white">بيان الصنف والمواصفات</th>
                    <th className="py-2.5 px-3 w-20 text-center border-l border-white/20 text-white">الكمية</th>
                    <th className="py-2.5 px-3 w-28 text-left border-l border-white/20 text-white">سعر الوحدة</th>
                    <th className="py-2.5 px-3 w-28 text-left text-white">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => (
                    <tr 
                      key={item.id || idx} 
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                    >
                      <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-600 border-l border-slate-200">{idx + 1}</td>
                      <td className="py-2.5 px-3 border-l border-slate-200">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        {item.serialNumbers && item.serialNumbers.length > 0 && (
                          <div 
                            className="text-[10px] font-mono mt-0.5 font-bold"
                            style={{ color: LOGO_BLUE }}
                          >
                            سيريال: {item.serialNumbers.join(' | ')}
                          </div>
                        )}
                      </td>
                      <td 
                        className="py-2.5 px-3 text-center font-mono font-black border-l border-slate-200"
                        style={{ backgroundColor: 'rgba(254, 237, 1, 0.14)', color: LOGO_BLUE }}
                      >
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-left font-mono font-medium text-slate-800 border-l border-slate-200" dir="ltr">
                        {item.price.toLocaleString()} ج.س
                      </td>
                      <td 
                        className="py-2.5 px-3 text-left font-mono font-black" 
                        style={{ color: LOGO_BLUE }}
                        dir="ltr"
                      >
                        {item.total.toLocaleString()} ج.س
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Multi-page visual guide for preview mode when items exceed single sheet */}
            {isMultiPageEstimated && (
              <div 
                className="my-2 py-1 text-center text-[10px] border-y border-dashed no-print font-bold"
                style={{ 
                  backgroundColor: 'rgba(254, 237, 1, 0.15)', 
                  borderColor: LOGO_GOLD_ACCENT,
                  color: LOGO_BLUE 
                }}
              >
                -- يتناسق محتوى الفاتورة تلقائياً على ورق A4 عند الطباعة (صفحتين أو أكثر) مع الحفاظ على الترويسة والجداول --
              </div>
            )}

            {/* Totals and Tafqeet Section (ملخص المبالغ والتفقيط - كحلي وأصفر الشعار) */}
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-4 p-3 rounded-lg text-xs avoid-page-break"
              style={{ 
                backgroundColor: 'rgba(40, 31, 110, 0.02)', 
                border: '1px solid rgba(40, 31, 110, 0.15)' 
              }}
            >
              
              {/* Right: Tafqeet & QR */}
              <div className="flex flex-col justify-between space-y-2.5">
                <div 
                  className="bg-white p-3 rounded-lg shadow-xs"
                  style={{ border: '1px solid rgba(40, 31, 110, 0.18)' }}
                >
                  <span className="block text-[10px] font-bold mb-1" style={{ color: LOGO_BLUE }}>المبلغ كتابةً وتفقيطاً:</span>
                  <p className="font-bold text-slate-900 text-xs leading-relaxed">
                    فقط {arabicTafqeet} لا غير.
                  </p>
                </div>

                <div 
                  className="flex items-center gap-3 bg-white p-2 rounded-lg"
                  style={{ border: '1px solid rgba(40, 31, 110, 0.15)' }}
                >
                  <img src={qrSvgUrl} alt="QR Code" className="w-13 h-13 shrink-0 rounded border border-slate-200" />
                  <div className="text-[10px] leading-tight">
                    <p className="font-black" style={{ color: LOGO_BLUE }}>ابن السنوسي للحلول المتكاملة</p>
                    <p className="text-[9px] font-bold mt-0.5" style={{ color: '#8A6800' }}>هاتف: +249900009596</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">الخرطوم بحري كوبر</p>
                  </div>
                </div>
              </div>

              {/* Left: Summary Calculations */}
              <div 
                className="space-y-1.5 bg-white p-3 rounded-lg shadow-xs"
                style={{ border: '1px solid rgba(40, 31, 110, 0.18)' }}
              >
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي ({totalUnits} قطع):</span>
                  <span className="font-mono font-bold" style={{ color: LOGO_BLUE }}>{invoice.subtotal.toLocaleString()} ج.س</span>
                </div>

                {invoice.discount > 0 && (
                  <div className="flex justify-between text-rose-700 font-medium">
                    <span>الخصم الممنوح:</span>
                    <span className="font-mono font-bold">-{invoice.discount.toLocaleString()} ج.س</span>
                  </div>
                )}

                {invoice.tax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>ضريبة القيمة المضافة:</span>
                    <span className="font-mono font-bold text-slate-900">+{invoice.tax.toLocaleString()} ج.س</span>
                  </div>
                )}

                {/* Grand Total Highlight Box (كحلي الشعار الفاخر بإطار أصفر الشعار) */}
                <div 
                  className="flex justify-between items-center text-sm font-black p-2.5 rounded-lg mt-1.5 shadow-sm"
                  style={{ 
                    backgroundColor: LOGO_BLUE, 
                    border: `2px solid ${LOGO_YELLOW}`,
                    color: '#FFFFFF'
                  }}
                >
                  <span style={{ color: LOGO_YELLOW }}>
                    {isProforma ? 'إجمالي الفاتورة المبدئية:' : 'المبلغ الإجمالي النهائي:'}
                  </span>
                  <span className="font-mono text-base font-black text-white">
                    {invoice.total.toLocaleString()} ج.س
                  </span>
                </div>

                {!isProforma && (
                  <>
                    <div className="flex justify-between text-slate-700 pt-1 text-[11px]">
                      <span>المبلغ المدفوع:</span>
                      <span className="font-mono font-bold" style={{ color: LOGO_BLUE }}>
                        {(invoice.paidAmount || invoice.total).toLocaleString()} ج.س
                      </span>
                    </div>

                    {invoice.total > (invoice.paidAmount || invoice.total) && (
                      <div 
                        className="flex justify-between font-black text-[11px] p-1.5 rounded"
                        style={{ 
                          backgroundColor: 'rgba(254, 237, 1, 0.2)', 
                          border: `1px solid ${LOGO_GOLD_ACCENT}`,
                          color: LOGO_BLUE 
                        }}
                      >
                        <span>المتبقي ذمم / آجل:</span>
                        <span className="font-mono">{(invoice.total - (invoice.paidAmount || 0)).toLocaleString()} ج.س</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Official Stamp & Signatures Area (موضع الختم: الختم فقط) */}
            <div className="grid grid-cols-2 gap-6 my-6 pt-5 border-t border-slate-200 text-xs avoid-page-break">
              
              {/* جهة توقيع العميل / المستلم */}
              <div className="text-center flex flex-col justify-between items-center min-h-[125px]">
                <p className="font-bold text-xs" style={{ color: LOGO_BLUE }}>
                  {isProforma ? 'اعتماد وموافقة العميل' : 'توقيع المستلم / العميل'}
                </p>
                <div 
                  className="w-44 border-b-2 border-dashed my-auto pt-8"
                  style={{ borderColor: 'rgba(40, 31, 110, 0.35)' }}
                ></div>
                <p className="text-[10px] text-slate-500">
                  {isProforma ? 'اعتماد العميل للموافقة على عرض الأسعار' : 'استلمت البضاعة بحالة سليمة ومطابقة للمواصفات'}
                </p>
              </div>

              {/* جهة موضع الختم - مكتوب "الختم" فقط بإطار أصفر الشعار */}
              <div className="text-center flex flex-col items-center justify-between min-h-[125px]">
                {/* موضع الختم: مستطيل مخصص للختم مكتوب داخله "الختم" فقط */}
                <div 
                  className="w-36 h-24 rounded-xl border-2 border-dashed flex items-center justify-center my-0.5"
                  style={{ 
                    borderColor: LOGO_GOLD_ACCENT, 
                    backgroundColor: 'rgba(254, 237, 1, 0.12)' 
                  }}
                >
                  <span 
                    className="text-sm font-black tracking-wider"
                    style={{ color: '#8A6800' }}
                  >
                    الختم
                  </span>
                </div>

                <div 
                  className="w-40 border-b mx-auto pt-1"
                  style={{ borderColor: 'rgba(40, 31, 110, 0.25)' }}
                ></div>
                <p className="text-[10px] text-slate-500 mt-0.5">توقيع المسؤول المعتمد</p>
              </div>
            </div>

            {/* Footer with company details and terms */}
            <div className="mt-6 pt-3 border-t border-slate-200 text-[10px] text-slate-500 text-center space-y-0.5 avoid-page-break">
              <p className="font-bold" style={{ color: LOGO_BLUE }}>
                ابن السنوسي للحلول المتكاملة • هاتف: +249900009596
              </p>
              <p className="text-slate-500 font-medium">
                العنوان: الخرطوم بحري كوبر شرق كبري الخرطوم كوبر
              </p>
              <p className="text-slate-400 text-[9px]">
                • البضاعة المباعة تخضع للضمان المصنعي المعتمد • الفاتورة المبدئية غير ملزمة وصالحة لمدة 7 أيام عمل
              </p>
            </div>

            {/* Bottom Corporate Accent Bar (شريط سفلي بلوني الشعار) */}
            <div className="flex h-2.5 w-full -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 mt-5 print-footer-bar overflow-hidden">
              <div className="h-full w-28 sm:w-36" style={{ backgroundColor: LOGO_YELLOW }}></div>
              <div className="h-full flex-1" style={{ backgroundColor: LOGO_BLUE }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default OfficialInvoiceModal;
