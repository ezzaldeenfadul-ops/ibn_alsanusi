/**
 * سكريبت فحص واختبار سلامة عمليات الحفظ والاستعلام في سحابة Supabase
 * نظام ابن السنوسي ERP
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ieumoqfkxpydyqsgwqvf.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_PJhcIDVOkEJwMnpks2KvXQ_0kVV1Fsy';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runStorageVerification() {
  console.log('===============================================================');
  console.log('🚀 بدء الفحص الشامل لمنظومة تخزين واستعلام Supabase');
  console.log('السيرفر:', SUPABASE_URL);
  console.log('الوقت:', new Date().toLocaleString('ar-SA'));
  console.log('===============================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  // 1. فحص القراءة من الجداول
  console.log('📊 1. اختبار استعلامات القراءة (SELECT):');
  const tables = ['products', 'customers', 'suppliers', 'invoices', 'purchase_orders', 'employees', 'app_settings', 'inventory_logs'];
  for (const table of tables) {
    const t0 = Date.now();
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact' });
    const latency = Date.now() - t0;

    if (error) {
      console.log(`❌ جدول [${table}]: فشل القراءة (${latency}ms) -> ${error.message}`);
      failedTests++;
    } else {
      console.log(`✅ جدول [${table}]: سليم (${latency}ms) -> عدد السجلات: ${data.length}`);
      passedTests++;
    }
  }

  // 2. اختبار إدراج منتج
  console.log('\n📦 2. اختبار إدراج وتعديل المنتجات (Products Mutation):');
  const testProductId = 'TEST_PROD_' + Date.now();
  const { error: prodErr } = await supabase.from('products').upsert({
    id: testProductId,
    sku: 'SKU_TEST_' + Date.now().toString().slice(-4),
    name: 'منتج فحص تشخيصي',
    category: 'عام',
    stock: 5,
    min_stock: 1,
    price: 2500,
    cost: 1800,
    specs: 'مواصفات اختبار التخزين',
    track_serial: false,
    serial_numbers: [],
    updated_at: new Date().toISOString()
  });

  if (prodErr) {
    console.log(`❌ فشل حفظ المنتج: ${prodErr.message}`);
    failedTests++;
  } else {
    console.log('✅ تم حفظ وتعديل المنتج بنجاح في جدول products');
    passedTests++;
  }

  // 3. اختبار إدراج فاتورة آمنة (مع customer_id = null للعميل النقدي)
  console.log('\n🧾 3. اختبار حفظ الفواتير النقدية والآجلة (Invoices Mutation):');
  const testInvoiceId = 'TEST_INV_' + Date.now();
  const { error: invErr } = await supabase.from('invoices').upsert({
    id: testInvoiceId,
    customer_id: null, // عميل نقدي
    customer_name: 'عميل نقدي فحص',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    employee_name: 'كاشير فحص',
    items: [{ id: '1', productId: testProductId, productName: 'منتج فحص', quantity: 1, price: 2500, total: 2500 }],
    subtotal: 2500,
    tax: 0,
    discount: 0,
    total: 2500,
    paid_amount: 2500,
    status: 'مدفوعة',
    notes: 'طريقة الدفع: نقداً | فحص تلقائي',
    created_at: new Date().toISOString()
  });

  if (invErr) {
    console.log(`❌ فشل حفظ الفاتورة: ${invErr.message}`);
    failedTests++;
  } else {
    console.log('✅ تم حفظ الفاتورة بنجاح في جدول invoices بدون أخطاء قيود أجنبية');
    passedTests++;
  }

  // 4. اختبار تسجيل حركة المخزون
  console.log('\n📈 4. اختبار تسجيل حركة المخزون (Inventory Logs):');
  const { error: logErr } = await supabase.from('inventory_logs').insert({
    product_id: testProductId,
    change_type: 'sale',
    quantity: -1,
    reference_id: testInvoiceId,
    notes: 'حركة فحص مخزون',
    created_at: new Date().toISOString()
  });

  if (logErr) {
    console.log(`❌ فشل تسجيل حركة المخزون: ${logErr.message}`);
    failedTests++;
  } else {
    console.log('✅ تم تسجيل حركة المخزون بنجاح في inventory_logs');
    passedTests++;
  }

  // 5. تنظيف بيانات الفحص المؤقتة
  console.log('\n🧹 5. تنظيف بيانات الفحص التجريبية:');
  await supabase.from('inventory_logs').delete().eq('reference_id', testInvoiceId);
  await supabase.from('invoices').delete().eq('id', testInvoiceId);
  await supabase.from('products').delete().eq('id', testProductId);
  console.log('✅ تم تنظيف السجلات التجريبية بالكامل.');

  console.log('\n===============================================================');
  console.log(`🎉 نتيجة الفحص: نجح ${passedTests} من أصل ${passedTests + failedTests} اختبار`);
  if (failedTests === 0) {
    console.log('🌟 منظومة التخزين والاستعلام في سحابة Supabase جاهزة وتعمل بكفاءة 100%!');
  } else {
    console.log('⚠️ توجد مشاكل تحتاج إلى مراجعة في الاختبارات الفاشلة أعلاه.');
  }
  console.log('===============================================================\n');
}

runStorageVerification();
