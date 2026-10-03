import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, Sun, Truck, Briefcase, BarChart, FileText, Settings as SettingsIcon, LogOut } from './Icons';
import { ViewState, Employee, EmployeeRole } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentUser: Employee;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen, currentUser, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'pos', label: 'نقاط البيع (كاشير)', icon: ShoppingCart },
    { id: 'invoices', label: 'سجل الفواتير', icon: FileText },
    { id: 'inventory', label: 'المخزون والمنتجات', icon: Package },
    { id: 'purchases', label: 'المشتريات والموردين', icon: Truck },
    { id: 'customers', label: 'العملاء', icon: Users },
    { id: 'employees', label: 'الموظفين والفنيين', icon: Briefcase },
    { id: 'reports', label: 'التقارير', icon: BarChart },
    { id: 'settings', label: 'الإعدادات', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Overlay with Blur */}
      <div 
        className={`fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />
      
      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 right-0 z-50
        w-72 md:w-64 bg-brand-blue text-white shadow-2xl md:shadow-none transform transition-transform duration-300 ease-in-out
        flex flex-col h-full
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-blue-800 flex items-center gap-3 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-lg shrink-0 overflow-hidden flex items-center justify-center">
            <img src="/Logo.png" alt="ابن السنوسي" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none tracking-tight">ابن السنوسي</h1>
            <p className="text-xs text-blue-200 mt-1 opacity-80">أنظمة الطاقة الشمسية</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as ViewState);
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-brand-yellow text-brand-blue font-bold shadow-lg translate-x-[-4px]' 
                    : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}
                `}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-800 bg-blue-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-sm font-bold border-2 border-blue-600">
              {currentUser.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-blue-300 truncate">{currentUser.role}</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-red-300 hover:text-red-100 hover:bg-red-500/20 rounded-lg transition-colors shrink-0" 
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;