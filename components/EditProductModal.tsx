import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { X, CheckCircle2 } from './Icons';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => Promise<void> | void;
  product: Product | null;
  categories: string[];
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [specs, setSpecs] = useState('');
  const [trackSerial, setTrackSerial] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setSku(product.sku || '');
      setName(product.name || '');
      setCategory(product.category || (categories[0] || ''));
      setStock(product.stock ?? 0);
      setMinStock(product.minStock ?? 5);
      setPrice(product.price ?? 0);
      setCost(product.cost ?? 0);
      setSpecs(product.specs || '');
      setTrackSerial(Boolean(product.trackSerial));
    }
  }, [product, categories]);

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

    setIsSubmitting(true);
    try {
      const updatedProduct: Product = {
        ...product,
        sku: sku.trim(),
        name: name.trim(),
        category,
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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 my-auto animate-scale-up text-right">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-brand-blue to-blue-800 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>تعديل بيانات المنتج</span>
            </h2>
            <p className="text-xs text-blue-100 mt-1">
              سيتم تطبيق التعديلات فوراً في المخزن وقاعدة البيانات السحابية
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
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
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-mono text-sm bg-slate-50 focus:bg-white transition-all" 
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

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">الفئة *</label>
              <select 
                required 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-slate-50 focus:bg-white transition-all text-sm font-medium"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
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
            <div className="flex items-center gap-3 pt-6">
              <label className="relative flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={trackSerial} 
                  onChange={e => setTrackSerial(e.target.checked)} 
                  className="w-5 h-5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue cursor-pointer" 
                />
                <span className="mr-2 font-bold text-slate-700 text-sm">تتبع الأرقام التسلسلية لهذا الصنف</span>
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
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-xs sm:text-sm bg-slate-50 focus:bg-white transition-all" 
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
