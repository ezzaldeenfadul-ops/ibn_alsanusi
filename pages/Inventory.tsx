import React, { useState } from 'react';
import { Product } from '../types';
import { Search, Package, Plus, AlertTriangle, Barcode } from '../components/Icons';
import AddProductModal from '../components/AddProductModal';

interface InventoryProps {
  products: Product[];
  categories: string[];
  onAddProduct: (product: Product) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, categories, onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.includes(searchTerm) || product.sku.includes(searchTerm);
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">المخزون والمنتجات</h2>
          <p className="text-gray-500 text-sm">إدارة الألواح الشمسية، الانفرترات، والبطاريات</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-blue text-white px-4 py-2.5 rounded-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 active:scale-95 duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="بحث باسم المنتج أو الكود (SKU)..."
            className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="w-full md:w-auto px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 bg-white cursor-pointer"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">جميع الفئات</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[800px]">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">كود المنتج</th>
                <th className="px-6 py-4 font-medium">اسم المنتج</th>
                <th className="px-6 py-4 font-medium">الفئة</th>
                <th className="px-6 py-4 font-medium">المواصفات</th>
                <th className="px-6 py-4 font-medium">السعر</th>
                <th className="px-6 py-4 font-medium">المخزون</th>
                <th className="px-6 py-4 font-medium">تتبع التسلسل</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">{product.sku}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="px-2 py-1 rounded bg-gray-100 text-xs whitespace-nowrap">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs" title={product.specs}>
                    {product.specs}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800 whitespace-nowrap">
                    {product.price.toLocaleString()} <span className="text-xs font-normal text-gray-400">ج.س</span>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4">
                    {product.trackSerial ? (
                       <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-full text-xs font-bold w-fit whitespace-nowrap" title="يتطلب رقم تسلسلي">
                        <Barcode className="w-3 h-3" />
                        نعم ({product.serialNumbers?.length || 0})
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {product.stock <= product.minStock ? (
                      <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold w-fit whitespace-nowrap">
                        <AlertTriangle className="w-3 h-3" />
                        منخفض
                      </span>
                    ) : (
                      <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                        متوفر
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>لا توجد منتجات مطابقة للبحث</p>
          </div>
        )}
      </div>

      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={onAddProduct}
        categories={categories}
      />
    </div>
  );
};

export default Inventory;