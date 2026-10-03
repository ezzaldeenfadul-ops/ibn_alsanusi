import React, { useState } from 'react';
import { Product } from '../types';
import { X } from './Icons';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  categories: string[];
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSave, categories }) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(categories[0] || '');
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [specs, setSpecs] = useState('');
  const [trackSerial, setTrackSerial] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: Date.now().toString(),
      sku,
      name,
      category,
      stock,
      minStock,
      price,
      cost,
      specs,
      trackSerial,
      serialNumbers: []
    };
    onSave(newProduct);
    
    // Reset fields
    setSku('');
    setName('');
    setCategory(categories[0] || '');
    setStock(0);
    setMinStock(5);
    setPrice(0);
    setCost(0);
    setSpecs('');
    setTrackSerial(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">إضافة منتج جديد</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">كود المنتج (SKU) *</label>
              <input required type="text" value={sku} onChange={e => setSku(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">اسم المنتج *</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">الفئة *</label>
              <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">المخزون الحالي *</label>
              <input required type="number" min="0" value={stock} onChange={e => setStock(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">الحد الأدنى للمخزون *</label>
              <input required type="number" min="0" value={minStock} onChange={e => setMinStock(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">سعر البيع *</label>
              <input required type="number" min="0" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">التكلفة</label>
              <input type="number" min="0" step="0.01" value={cost} onChange={e => setCost(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>

            <div className="space-y-2 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors h-[42px]">
                <input type="checkbox" checked={trackSerial} onChange={e => setTrackSerial(e.target.checked)} className="w-4 h-4 text-brand-blue rounded focus:ring-brand-blue/20" />
                <span className="text-sm font-medium text-gray-700">تتبع السيريال نمبر (الرقم التسلسلي)</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">المواصفات الفنية</label>
            <textarea rows={3} value={specs} onChange={e => setSpecs(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue resize-none" placeholder="اكتب مواصفات المنتج هنا..."></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium">
              إلغاء
            </button>
            <button type="submit" className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 font-medium">
              حفظ المنتج
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
