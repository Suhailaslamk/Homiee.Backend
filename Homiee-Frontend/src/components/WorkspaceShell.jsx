import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home } from 'lucide-react';

export default function WorkspaceShell({ title, subtitle, navItems, children, accent = 'blue' }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const accentStyles = {
    blue: 'bg-[#2d3a2e] text-white shadow-lg shadow-[#2d3a2e]/20',
    slate: 'bg-[#1e3a24] text-white shadow-lg shadow-[#1e3a24]/20',
    admin: 'bg-[#1e3a24] text-white shadow-lg shadow-[#1e3a24]/20',
    forest: 'bg-[#1e3a24] text-white shadow-lg shadow-[#1e3a24]/20',
  };

  const navLinkClass = (isActive) => 
    `flex items-center gap-3 rounded-[20px] px-4 py-3.5 font-bold transition-all border ${
      isActive 
        ? `${accentStyles[accent] || accentStyles.blue} border-transparent` 
        : 'text-stone-600 hover:bg-[#f1f5f2] hover:text-stone-900 border-transparent hover:border-[#c0d8c4]'
    }`;

  return (
    <div className="min-h-screen bg-[#e8eee9] pt-24 pb-20 lg:pb-0">
      <div className="mx-auto flex max-w-7xl gap-8 px-4 sm:px-6 lg:px-8 pb-16">
        {/* Desktop Sidebar */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-28 rounded-[34px] border border-[#c0d8c4] bg-white p-5 shadow-2xl shadow-stone-200/40">
            <div className="mb-8 px-3">
              <h1 className="text-2xl font-black text-stone-800 leading-tight">{title}</h1>
              <p className="mt-3 text-sm font-medium text-stone-500 leading-relaxed">{subtitle}</p>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} className={navLinkClass(location.pathname === item.path)}>
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-stone-100">
                <Link to="/" className="flex items-center gap-3 rounded-[20px] px-4 py-3.5 font-bold text-stone-400 hover:text-stone-800 transition-colors">
                  <Home size={18} />
                  Public Site
                </Link>
              </div>
            </nav>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="flex flex-col lg:hidden w-full mb-6">
          <div className="flex items-center justify-between p-2">
            <div>
              <h1 className="text-2xl font-black text-stone-800">{title}</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1e3a24] mt-1">{subtitle}</p>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-[#c0d8c4] text-stone-700 shadow-sm"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-[300px] border-l border-[#c0d8c4] bg-[#f1f5f2] p-8 shadow-2xl animate-in slide-in-from-right duration-500 ease-out">
              <div className="flex items-center justify-between mb-10">
                <span className="text-xl font-black text-stone-900">Workspace</span>
                <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-stone-100 text-stone-600">
                  <X size={20} />
                </button>
              </div>
              <nav className="space-y-3">
                {navItems.map((item) => (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    onClick={() => setMobileMenuOpen(false)}
                    className={navLinkClass(location.pathname === item.path)}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="absolute bottom-8 left-8 right-8">
                <Link to="/" className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-stone-900 text-white font-black text-sm">
                  <Home size={18} />
                  Public Marketplace
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#c0d8c4] bg-white/90 px-4 pt-3 pb-8 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-[#1e3a24] scale-110' : 'text-stone-400 hover:text-stone-600'}`}
              >
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-[#1e3a24]/10' : ''}`}>
                  <item.icon size={22} className={isActive ? 'stroke-[2.5px]' : ''} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
