import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { X, CheckCircle2, Package } from './Icons';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => Promise<void> | void;
  product: Product | null;
  categories: string[];
}

const DEFAULT_CATEGORIES = [
  'ألواح شمسية',
  'محول (Inverter)',
  'بطارية',
  'كابلات',
  'هياكل تثبيت',
  'ملحقات واكسسوارات',
  'طلمبات وغواطس',
  'خدمة / تركيب',
  'عام'
];

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
}) => {
  // دمج الفئات لضمان وجود فئة المنتج الحالية وكافة الفئات المتاحة
  const availableCategories = useMemo(() => {
    const list = Array.isArray(categories) && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    const currentProdCategory = product?.category ? [product.category] : [];
    return Array.from(new Set([...currentProdCategory, ...list, ...DEFAULT_CATEGORIES])).filter(Boolean);
  }, [categories, product]);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [specs, setSpecs] = useState('');
  const [trackSerial, setTrackSerial] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product && isOpen) {
      setSku(product.sku || '');
      setName(product.name || '');
      setCategory(product.category || (availableCategories[0] || 'ألواح شمسية'));
      setIsCustomCategory(false);
      setCustomCategoryInput('');
      setStock(product.stock ?? 0);
      setMinStock(product.minStock ?? 5);
      setPrice(product.price ?? 0);
      setCost(product.cost ?? 0);
      setSpecs(product.specs || '');
      setTrackSerial(Boolean(product.trackSerial));
    }
  }, [product, isOpen, availableCategories]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('يرجى إدخال اسم المنتج.');
      return;
    }
    if (!sku.trim()) {
      alert('يرجى إدخال كود المنتج (SKU).');
      return;
    }

    const finalCategory = isCustomCategory 
      ? customCategoryInput.trim() 
      : category.trim();

    if (!finalCategory) {
      alert('يرجى تحديد أو كتابة فئة المنتج.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedProduct: Product = {
        ...product,
        sku: sku.trim(),
        name: name.trim(),
        category: finalCategory,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 0,
        price: Number(price) || 0,
        cost: Number(cost) || 0,
        specs: specs.trim(),
        trackSerial,
      };

      await onSave(updatedProduct);
      onClose();
    } catch (err: any) {
      alert(`حدث خطأ أثناء حفظ التعديل: ${err?.message || 'يرجى المحاولة مجدداً'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto animate-fade-in text-right">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 my-auto animate-scale-up">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-brand-blue to-blue-800 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">تعديل بيانات المنتج</h2>
              <p className="text-xs text-blue-100 mt-0.5">
                تحديث بيانات الصنف ومزامنته في المخزن وقاعدة البيانات
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            
            {/* SKU */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">كود المنتج (SKU) *</label>
              <input 
                required 
                type="text" 
                value={sku} 
                onChange={e => setSku(e.target.value)} 
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-mono text-sm bg-slate-50 focus:bg-white transition-all font-bold" 
              />
            </div>
            
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">اسم المنتج *</label>
              <input 
                required 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-sm bg-slate-50 focus:bg-white transition-all font-bold text-slate-800" 
              />
            </div>

            {/* Category Selector with Custom Category Support */}
            <div className="space-y-1.5 md:col-span-2 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100">
              <div className="flex justify-between items-center mb-1">
                <label className="block font-bold text-brand-blue">
                  الفئة والتصنيف *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 hover:border-blue-400 px-3 py-1 rounded-lg transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  {isCustomCategory ? '📋 اختيار من القائمة' : '➕ كتابة فئة جديدة'}
                </button>
              </div>

              {isCustomCategory ? (
                <div className="space-y-1">
                  <input
                    required
                    type="text"
                    placeholder="اكتب اسم الفئة الجديدة هنا..."
                    value={customCategoryInput}
                    onChange={e => setCustomCategoryInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-2 border-brand-blue/40 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white text-sm font-bold text-slate-800"
                    autoFocus
                  />
                  <p className="text-[11px] text-gray-500">سيتم ربط المنتج بالفئة الجديدة وتحديث النظام.</p>
                </div>
              ) : (
                <select 
                  required 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white transition-all text-sm font-bold text-slate-800 cursor-pointer shadow-sm"
                >
                  {availableCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Current Stock */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">المخزون الحالي في المستودع *</label>
              <input 
                required 
                type="number" 
                min="0" 
                value={stock} 
                onChange={e => setStock(Number(e.target.value))} 
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-mono font-bold text-sm bg-slate-50 focus:bg-white transition-all" 
              />
            </div>

            {/* Min Stock Alert */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">الحد الأدنى للتنبيه *</label>
              <input 
                required 
                type="number" 
                min="0" 
                value={minStock} 
                onChange={e => setMinStock(Number(e.target.value))} 
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-mono text-sm bg-slate-50 focus:bg-white transition-all" 
              />
            </div>

            {/* Sale Price */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">سعر البيع (ج.س) *</label>
              <input 
                required 
                type="number" 
                min="0" 
                step="0.01" 
                value={price} 
                onChange={e => setPrice(Number(e.target.value))} 
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-mono font-black text-sm text-brand-blue bg-slate-50 focus:bg-white transition-all" 
              />
            </div>

            {/* Cost */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">سعر التكلفة (ج.س)</label>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={cost} 
                onChange={e => setCost(Number(e.target.value))} 
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-mono text-sm bg-slate-50 focus:bg-white transition-all" 
              />
            </div>

            {/* Track Serial */}
            <div className="flex items-center gap-3 pt-6 md:col-span-2">
              <label className="relative flex items-center cursor-pointer select-none p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors w-full">
                <input 
                  type="checkbox" 
                  checked={trackSerial} 
                  onChange={e => setTrackSerial(e.target.checked)} 
                  className="w-5 h-5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer" 
                />
                <span className="mr-3 font-bold text-slate-700 text-sm">تتبع الأرقام التسلسلية لهذا الصنف</span>
              </label>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 text-xs sm:text-sm">المواصفات الفنية والوصف</label>
            <textarea 
              rows={3} 
              value={specs} 
              onChange={e => setSpecs(e.target.value)} 
              placeholder="مثال: القدرة 550 وات، كفاءة 21.3%، أحادي البلورة (Monocrystalline)..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-xs sm:text-sm bg-slate-50 focus:bg-white transition-all resize-none" 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              إلغاء الأمر
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>جاري حفظ التعديل...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ التعديلات في قاعدة البيانات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
