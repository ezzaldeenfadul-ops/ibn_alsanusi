export enum CustomerType {
  INDIVIDUAL = 'فرد',
  COMPANY = 'شركة'
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: CustomerType;
  address: string;
  email?: string;
  balance: number; 
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number; 
  cost: number; 
  specs?: string;
  trackSerial?: boolean; // New: Flag to indicate if serials are tracked
  serialNumbers?: string[]; // New: Available serial numbers in stock
}

export interface InvoiceItem {
  id: string; // unique id for the row
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  serialNumbers?: string[]; // New: Selected serial numbers for this item
}

export enum InvoiceStatus {
  DRAFT = 'مسودة',
  PENDING = 'معلق',
  PAID = 'مدفوع',
  PARTIAL = 'مدفوع جزئياً',
  CANCELLED = 'ملغي'
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  date: string; 
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes?: string;
  time?: string; // New: Transaction time
  employeeName?: string; // New: Employee name who issued the invoice
  paymentMethod?: string; // طريقة الدفع: نقداً، بنكك / تحويل، بطاقة، آجل
}

// --- New Types ---

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  status: 'ordered' | 'received' | 'cancelled';
  total: number;
  items: InvoiceItem[];
}

export enum EmployeeRole {
  MANAGER = 'مدير',
  SALES = 'مبيعات',
  TECHNICIAN = 'فني تركيب',
  ACCOUNTANT = 'محاسب'
}

export interface Employee {
  id: string;
  name: string;
  username?: string;
  password?: string;
  role: EmployeeRole;
  phone: string;
  status: 'active' | 'inactive';
}

export type ViewState = 'dashboard' | 'inventory' | 'pos' | 'invoices' | 'customers' | 'purchases' | 'employees' | 'reports' | 'settings';