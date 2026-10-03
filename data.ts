import { Customer, Invoice, Product, Employee, Supplier, PurchaseOrder } from './types';

// قاعدة بيانات أولية فارغة تماماً (Clean Production State)
export const initialCustomers: Customer[] = [];

export const initialProducts: Product[] = [];

export const initialInvoices: Invoice[] = [];

export const initialEmployees: Employee[] = [];

export const initialSuppliers: Supplier[] = [];

export const initialPurchaseOrders: PurchaseOrder[] = [];

export const defaultCategories: string[] = [
  'ألوح شمسية',
  'محول (Inverter)',
  'بطارية',
  'كابلات',
  'هياكل تثبيت',
  'اكسسوارات',
  'خدمة / تركيب',
];
