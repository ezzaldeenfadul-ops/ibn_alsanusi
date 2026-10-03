import React from 'react';
import { Employee, EmployeeRole } from '../types';
import { Briefcase, Plus, User } from '../components/Icons';

interface EmployeesProps {
  employees: Employee[];
}

const Employees: React.FC<EmployeesProps> = ({ employees }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">الموظفين والفنيين</h2>
          <p className="text-gray-500 text-sm">إدارة فريق العمل والصلاحيات</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20">
          <Plus className="w-5 h-5" />
          <span>إضافة موظف</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((employee) => (
          <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-start">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-100 text-gray-400">
                <User className="w-6 h-6" />
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold
                ${employee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
              `}>
                {employee.status === 'active' ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-800 mb-1">{employee.name}</h3>
              <p className="text-brand-blue text-sm font-medium mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                {employee.role}
              </p>
              
              <div className="space-y-2 text-sm text-gray-600">
                 <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-400">الرقم الوظيفي</span>
                    <span className="font-mono">EMP-{employee.id.padStart(3, '0')}</span>
                 </div>
                 <div className="flex justify-between pt-1">
                    <span className="text-gray-400">رقم الهاتف</span>
                    <span dir="ltr">{employee.phone}</span>
                 </div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 flex gap-2">
                <button className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded text-sm hover:border-brand-blue hover:text-brand-blue transition-colors">
                    تعديل الملف
                </button>
                <button className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded text-sm hover:border-brand-blue hover:text-brand-blue transition-colors">
                    سجل الحضور
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Employees;