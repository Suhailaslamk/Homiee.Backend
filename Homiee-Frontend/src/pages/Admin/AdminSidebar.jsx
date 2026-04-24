import React from 'react';
import { 
  LayoutDashboard, Users, Store, ShieldCheck, 
  AlertTriangle, Settings, BarChart3, LogOut 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function AdminSidebar() {
  const location = useLocation();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin/dashboard' },
    { icon: ShieldCheck, label: 'Seller Approvals', path: '/admin/approvals', badge: 5 },
    { icon: Users, label: 'User Management', path: '/admin/users' },
    { icon: Store, label: 'Active Businesses', path: '/admin/stores' },
    { icon: AlertTriangle, label: 'Disputes', path: '/admin/disputes' },
    { icon: BarChart3, label: 'Financials', path: '/admin/analytics' },
  ];

  return (
    <aside className="w-72 bg-slate-900 h-screen sticky top-0 flex flex-col p-6 text-white">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black">A</div>
        <span className="text-xl font-black tracking-tight">ADMIN <span className="text-blue-500">PRO</span></span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3 font-bold">
                <item.icon size={20} />
                {item.label}
              </div>
              {item.badge && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-slate-800">
        <button className="flex items-center gap-3 p-4 w-full text-slate-400 font-bold hover:text-red-400 transition">
          <LogOut size={20} /> Logout
        </button>
      </div>
    </aside>
  );
}