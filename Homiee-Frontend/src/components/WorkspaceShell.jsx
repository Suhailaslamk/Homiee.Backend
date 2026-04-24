import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function WorkspaceShell({ title, subtitle, navItems, children, accent = 'blue' }) {
  const location = useLocation();
  const accentStyles = {
    blue: 'bg-[#d36f51] text-white',
    slate: 'bg-[#3f5143] text-white',
  };

  return (
    <div className="min-h-screen bg-[#f6f0e7] pt-24">
      <div className="mx-auto flex max-w-7xl gap-8 px-6 pb-16">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-28 rounded-[28px] border border-stone-200 bg-[#fffaf2] p-5 shadow-sm">
            <div className="mb-8 px-3">
              <h1 className="text-2xl font-black text-stone-900">{title}</h1>
              <p className="mt-2 text-sm text-stone-500">{subtitle}</p>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 font-bold transition ${
                      isActive ? accentStyles[accent] : 'text-stone-500 hover:bg-[#f2e7da] hover:text-stone-900'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon size={18} />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
