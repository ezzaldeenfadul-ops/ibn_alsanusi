import React, { useState } from 'react';
import { Product } from '../types';
import { Search, Package, Plus, AlertTriangle, Barcode, Trash, X, Edit } from '../components/Icons';
import AddProductModal from '../components/AddProductModal';
import EditProductModal from '../components/EditProductModal';

interface InventoryProps {
  products: Product[];
  categories: string[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => Promise<void> | void;
  onDeleteProduct: (productId: string) => Promise<void> | void;
}

const Inventory: React.FC<InventoryProps> = ({ 
  products, 
  categories, 
  onAddProduct, 
  onUpdateProduct,
  onDeleteProduct 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Edit Product Modal State
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete Confirmation Modal State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenEdit = (product: Product) => {
    setProductToEdit(product);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedProduct: Product) => {
    await onUpdateProduct(updatedProduct);
    setFeedbackToast({
      message: `تم تحديث بيانات المنتج "${updatedProduct.name}" وحفظ التعديل في قاعدة البيانات بنجاح!`,
      type: 'success'
    });
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const deletedName = productToDelete.name;
      await onDeleteProduct(productToDelete.id);
      setFeedbackToast({
        message: `تم حذف المنتج "${deletedName}" وما يتعلق به من قاعدة البيانات بنجاح!`,
        type: 'info'
      });
      setProductToDelete(null);
    } catch (err: any) {
      alert(`حدث خطأ أثناء محاولة الحذف: ${err?.message || 'يرجى المحاولة لاحقاً'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">المخزون والمنتجات</h2>
          <p className="text-gray-500 text-sm">إدارة الألواح الشمسية، الانفرترات، والبطاريات وقواعد البيانات</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-xl hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 active:scale-95 duration-200 font-bold text-sm cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedbackToast && (
        <div className={`p-4 rounded-xl border text-sm font-bold flex items-center justify-between shadow-sm animate-fade-in ${
          feedbackToast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
            : 'bg-blue-50 border-blue-300 text-brand-blue'
        }`}>
          <div className="flex items-center gap-2">
            <span>{feedbackToast.type === 'success' ? '✅' : 'ℹ️'}</span>
            <span>{feedbackToast.message}</span>
          </div>
          <button 
            onClick={() => setFeedbackToast(null)} 
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="بحث باسم المنتج أو الكود (SKU)..."
            className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 bg-white cursor-pointer text-sm font-medium"
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[850px]">
            <thead className="bg-gray-50/80 text-gray-600 text-xs uppercase border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold">كود المنتج</th>
                <th className="px-6 py-4 font-bold">اسم المنتج</th>
                <th className="px-6 py-4 font-bold">الفئة</th>
                <th className="px-6 py-4 font-bold">المواصفات</th>
                <th className="px-6 py-4 font-bold">السعر</th>
                <th className="px-6 py-4 font-bold">المخزون</th>
                <th className="px-6 py-4 font-bold">تتبع التسلسل</th>
                <th className="px-6 py-4 font-bold">الحالة</th>
                <th className="px-6 py-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 text-xs font-mono font-bold text-gray-500">{product.sku}</td>
                  <td className="px-6 py-4 font-bold text-sm text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-medium whitespace-nowrap">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 truncate max-w-xs" title={product.specs}>
                    {product.specs || '-'}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap font-mono">
                    {product.price.toLocaleString()} <span className="text-xs font-normal text-gray-400">ج.س</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-sm font-mono">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4">
                    {product.trackSerial ? (
                      <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full text-xs font-bold w-fit whitespace-nowrap border border-purple-200" title="يتطلب رقم تسلسلي">
                        <Barcode className="w-3 h-3" />
                        نعم ({product.serialNumbers?.length || 0})
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs font-mono">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {product.stock <= product.minStock ? (
                      <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold w-fit whitespace-nowrap border border-red-200">
                        <AlertTriangle className="w-3 h-3" />
                        منخفض
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap border border-emerald-200">
                        متوفر
                      </span>
                    )}
                  </td>

                  {/* Actions Column: Edit & Delete Buttons */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-2 text-brand-blue hover:text-white hover:bg-brand-blue rounded-xl transition-all duration-200 border border-blue-200 hover:border-brand-blue shadow-sm active:scale-95 inline-flex items-center gap-1 text-xs font-bold cursor-pointer"
                        title="تعديل بيانات هذا المنتج وحفظها في قاعدة البيانات"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>

                      <button
                        onClick={() => setProductToDelete(product)}
                        className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl transition-all duration-200 border border-rose-200 hover:border-rose-600 shadow-sm active:scale-95 inline-flex items-center gap-1 text-xs font-bold cursor-pointer"
                        title="حذف هذا المنتج من قاعدة البيانات"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-16 text-center text-gray-400">
            <Package className="w-14 h-14 mx-auto mb-3 opacity-30 text-slate-400" />
            <p className="font-bold text-gray-600">لا توجد منتجات مطابقة للبحث</p>
            <p className="text-xs text-gray-400 mt-1">اضغط على زر "إضافة منتج جديد" لإضافة منتجات جديدة للمخزن</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={onAddProduct}
        categories={categories}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveEdit}
        product={productToEdit}
        categories={categories}
      />

      {/* DELETE CONFIRMATION MODAL (نافذة تأكيد الحذف من قاعدة البيانات) */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-rose-100 text-right my-auto transform transition-all">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl shadow-inner">
                  <Trash className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black">تأكيد حذف المنتج</h3>
                  <p className="text-xs text-rose-100 mt-0.5">حذف دائم من قاعدة البيانات (Supabase)</p>
                </div>
              </div>
              <button
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-900 text-xs sm:text-sm font-medium leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً من قاعدة البيانات السحابية؟
                <p className="text-xs text-rose-700 font-bold mt-1.5">
                  ⚠️ تنبيه: سيتم حذف بيانات الصنف وجميع حركاته وسجلاته من قاعدة البيانات نهائياً، ولا يمكن التراجع عن هذا الإجراء!
                </p>
              </div>

              {/* Product Info Summary Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">اسم المنتج:</span>
                  <span className="font-bold text-slate-900 text-sm">{productToDelete.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">كود المنتج (SKU):</span>
                  <span className="font-mono font-bold text-slate-700">{productToDelete.sku}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">الفئة:</span>
                  <span className="font-bold text-slate-700">{productToDelete.category}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">الكمية بالمخزن:</span>
                  <span className="font-bold text-slate-900 font-mono">{productToDelete.stock} وحدة</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">السعر:</span>
                  <span className="font-bold text-brand-blue font-mono">{productToDelete.price.toLocaleString()} ج.س</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-all cursor-pointer"
                >
                  إلغاء الأمر
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>جاري الحذف...</span>
                    </>
                  ) : (
                    <>
                      <Trash className="w-4 h-4" />
                      <span>تأكيد الحذف النهائي</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
