import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { X, Plus, Package } from './Icons';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
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

const AddProductModal: React.FC<AddProductModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  categories 
}) => {
  // دمج الفئات المتاحة لضمان عدم وجود فئات فارغة أو مفقودة
  const availableCategories = useMemo(() => {
    const list = Array.isArray(categories) && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    return Array.from(new Set([...list, ...DEFAULT_CATEGORIES])).filter(Boolean);
  }, [categories]);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(availableCategories[0] || 'ألواح شمسية');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [specs, setSpecs] = useState('');
  const [trackSerial, setTrackSerial] = useState(false);

  // تحديث وإعادة تعيين الحقول عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      setCategory(availableCategories[0] || 'ألواح شمسية');
      setIsCustomCategory(false);
      setCustomCategoryInput('');
      setSku(`SKU-${Date.now().toString().slice(-5)}`);
    }
  }, [isOpen, availableCategories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = isCustomCategory 
      ? customCategoryInput.trim() 
      : category.trim();

    if (!finalCategory) {
      alert('يرجى اختيار أو كتابة فئة المنتج.');
      return;
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      sku: sku.trim(),
      name: name.trim(),
      category: finalCategory,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      specs: specs.trim(),
      trackSerial,
      serialNumbers: []
    };

    onSave(newProduct);
    
    // إعادة التعيين والإغلاق
    setSku('');
    setName('');
    setCategory(availableCategories[0] || 'ألواح شمسية');
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setStock(0);
    setMinStock(5);
    setPrice(0);
    setCost(0);
    setSpecs('');
    setTrackSerial(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto animate-fade-in text-right">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 my-auto animate-scale-up">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-brand-blue to-blue-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">إضافة منتج جديد للمخزن</h2>
              <p className="text-xs text-blue-100 mt-0.5">تسجيل الأصناف والألواح والبطاريات والمحولات</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            
            {/* كود المنتج */}
            <div className="space-y-1.5">
              <label className="block font-bold text-gray-700">كود المنتج (SKU) *</label>
              <input 
                required 
                type="text" 
                value={sku} 
                onChange={e => setSku(e.target.value)} 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-mono text-sm bg-slate-50 focus:bg-white transition-all" 
              />
            </div>
            
            {/* اسم المنتج */}
            <div className="space-y-1.5">
              <label className="block font-bold text-gray-700">اسم المنتج *</label>
              <input 
                required 
                type="text" 
                placeholder="مثال: لوح طاقة شمسية 550 وات جينكو"
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-sm bg-slate-50 focus:bg-white transition-all font-bold" 
              />
            </div>

            {/* الفئة والتصنيف مع إمكانية الاختيار أو كتابة فئة جديدة */}
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
                    placeholder="اكتب اسم الفئة الجديدة هنا (مثال: محولات هجينة، بطاريات جل...)"
                    value={customCategoryInput}
                    onChange={e => setCustomCategoryInput(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-brand-blue/40 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white text-sm font-bold text-slate-800"
                    autoFocus
                  />
                  <p className="text-[11px] text-gray-500">سيتم حفظ هذه الفئة تلقائياً واعتمادها في النظام.</p>
                </div>
              ) : (
                <select 
                  required 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white text-sm font-bold text-slate-800 cursor-pointer shadow-sm"
                >
                  {availableCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            {/* المخزون الحالي */}
            <div className="space-y-1.5">
              <label className="block font-bold text-gray-700">المخزون الحالي بالمستودع *</label>
              <input 
                required 
                type="number" 
                min="0" 
                value={stock} 
                onChange={e => setStock(Number(e.target.value))} 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-mono font-bold text-sm bg-slate-50 focus:bg-white transition-all" 
              />
            </div>

            {/* الحد الأدنى للمخزون */}
            <div className="space-y-1.5">
              <label className="block font-bold text-gray-700">الحد الأدنى للتنبيه *</label>
              <input 
                required 
                type="number" 
                min="0" 
                value={minStock} 
                onChange={e => setMinStock(Number(e.target.value))} 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-mono text-sm bg-slate-50 focus:bg-white transition-all" 
              />
            </div>

            {/* سعر البيع */}
            <div className="space-y-1.5">
              <label className="block font-bold text-gray-700">سعر البيع (ج.س) *</label>
              <input 
                required 
                type="number" 
                min="0" 
                step="0.01" 
                value={price} 
                onChange={e => setPrice(Number(e.target.value))} 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-mono font-bold text-brand-blue text-sm bg-slate-50 focus:bg-white transition-all" 
              />
            </div>

            {/* سعر التكلفة */}
            <div className="space-y-1.5">
              <label className="block font-bold text-gray-700">سعر التكلفة (ج.س)</label>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={cost} 
                onChange={e => setCost(Number(e.target.value))} 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-mono text-sm bg-slate-50 focus:bg-white transition-all" 
              />
            </div>

            {/* تتبع السيريال */}
            <div className="space-y-1.5 md:col-span-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={trackSerial} 
                  onChange={e => setTrackSerial(e.target.checked)} 
                  className="w-4 h-4 text-brand-blue rounded focus:ring-brand-blue/20 cursor-pointer" 
                />
                <span className="text-sm font-bold text-gray-700">تتبع السيريال نمبر (الرقم التسلسلي الخاص بكل وحدة)</span>
              </label>
            </div>
          </div>

          {/* المواصفات الفنية */}
          <div className="space-y-1.5">
            <label className="block font-bold text-gray-700 text-xs sm:text-sm">المواصفات الفنية والوصف</label>
            <textarea 
              rows={3} 
              value={specs} 
              onChange={e => setSpecs(e.target.value)} 
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-xs sm:text-sm resize-none bg-slate-50 focus:bg-white transition-all" 
              placeholder="اكتب مواصفات المنتج والقدرة والكفاءة هنا..."
            />
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2.5 text-gray-600 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm cursor-pointer"
            >
              إلغاء الأمر
            </button>
            <button 
              type="submit" 
              className="px-7 py-2.5 bg-brand-blue hover:bg-blue-800 text-white rounded-xl transition-all shadow-lg shadow-blue-900/20 font-bold text-sm cursor-pointer active:scale-95"
            >
              حفظ المنتج
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
