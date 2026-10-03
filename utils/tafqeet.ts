// دالة التفقيط باللغة العربية لتحويل الأرقام إلى نصوص في الفاتورة الرسمية المروسة
export function tafqeet(num: number, currency: string = 'جنيه سوداني'): string {
  if (isNaN(num) || num === 0) return `صفر ${currency} فقط لا غير`;

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convertHundreds(n: number): string {
    let result = '';
    const h = Math.floor(n / 100);
    const rem = n % 100;

    if (h > 0) {
      result += hundreds[h];
    }

    if (rem > 0) {
      if (h > 0) result += ' و';
      if (rem < 20) {
        result += ones[rem];
      } else {
        const t = Math.floor(rem / 10);
        const o = rem % 10;
        if (o > 0) {
          result += ones[o] + ' و' + tens[t];
        } else {
          result += tens[t];
        }
      }
    }
    return result;
  }

  const intPart = Math.floor(Math.abs(num));
  let parts: string[] = [];

  const billions = Math.floor(intPart / 1000000000);
  const millions = Math.floor((intPart % 1000000000) / 1000000);
  const thousands = Math.floor((intPart % 1000000) / 1000);
  const rest = intPart % 1000;

  if (billions > 0) {
    parts.push(convertHundreds(billions) + ' مليار');
  }
  if (millions > 0) {
    parts.push(convertHundreds(millions) + ' مليون');
  }
  if (thousands > 0) {
    if (thousands === 1) parts.push('ألف');
    else if (thousands === 2) parts.push('ألفان');
    else if (thousands >= 3 && thousands <= 10) parts.push(convertHundreds(thousands) + ' آلاف');
    else parts.push(convertHundreds(thousands) + ' ألف');
  }
  if (rest > 0) {
    parts.push(convertHundreds(rest));
  }

  const text = parts.join(' و');
  return `فقط وقدره ${text} ${currency} لا غير.`;
}
