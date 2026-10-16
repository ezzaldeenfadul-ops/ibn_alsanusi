import { 
  upsertProductToSupabase, 
  upsertCustomerToSupabase, 
  upsertSupplierToSupabase, 
  upsertInvoiceToSupabase, 
  upsertPurchaseOrderToSupabase,
  recordInventoryLogToSupabase 
} from './supabaseService';
import { Product, Customer, Supplier, Invoice, PurchaseOrder } from './types';

export interface PendingSyncItem {
  id: string;
  type: 'invoice' | 'product' | 'customer' | 'supplier' | 'purchase_order' | 'inventory_log';
  data: any;
  timestamp: number;
  retryCount: number;
}

const SYNC_QUEUE_KEY = 'erp_offline_sync_queue_v1';

// الحصول على طابور العمليات المعلقة
export function getPendingSyncQueue(): PendingSyncItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// إضافة عملية جديدة لطابور الانتظار
export function enqueuePendingSync(type: PendingSyncItem['type'], data: any) {
  try {
    const queue = getPendingSyncQueue();
    // تجنب التكرار لنفس المعرف إن وجد
    const itemId = data.id || `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const filtered = queue.filter(item => !(item.type === type && item.data.id && item.data.id === data.id));
    
    filtered.push({
      id: itemId,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    });

    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to enqueue pending sync:', err);
  }
}

// إزالة عملية نجحت مزامنتها
export function removePendingSyncItem(queueItemId: string) {
  try {
    const queue = getPendingSyncQueue();
    const updated = queue.filter(item => item.id !== queueItemId);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
  } catch {}
}

// معالجة ومزامنة كافة العمليات المعلقة في السحابة
export async function processPendingSyncQueue(): Promise<{
  total: number;
  succeeded: number;
  failed: number;
}> {
  const queue = getPendingSyncQueue();
  if (queue.length === 0) {
    return { total: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;
  const remainingItems: PendingSyncItem[] = [];

  for (const item of queue) {
    let success = false;
    try {
      switch (item.type) {
        case 'product':
          success = await upsertProductToSupabase(item.data as Product);
          break;
        case 'customer':
          success = await upsertCustomerToSupabase(item.data as Customer);
          break;
        case 'supplier':
          success = await upsertSupplierToSupabase(item.data as Supplier);
          break;
        case 'invoice':
          success = await upsertInvoiceToSupabase(item.data as Invoice);
          break;
        case 'purchase_order':
          success = await upsertPurchaseOrderToSupabase(item.data as PurchaseOrder);
          break;
        case 'inventory_log':
          success = await recordInventoryLogToSupabase(item.data);
          break;
      }
    } catch {
      success = false;
    }

    if (success) {
      succeeded++;
    } else {
      failed++;
      // إعادة وضعها في الطابور مع زيادة عداد المحاولات (حتى 10 محاولات كحد أقصى)
      if (item.retryCount < 10) {
        remainingItems.push({
          ...item,
          retryCount: item.retryCount + 1,
        });
      }
    }
  }

  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingItems));
  } catch {}

  return {
    total: queue.length,
    succeeded,
    failed,
  };
}
