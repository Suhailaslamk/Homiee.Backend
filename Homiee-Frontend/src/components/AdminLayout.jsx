import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../pages/Admin/AdminSidebar';
import { Menu, X } from 'lucide-react';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
      {/* Sidebar */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar — ONLY on mobile (lg:hidden) */}
        <header className="lg:hidden shrink-0 flex items-center justify-between px-4 py-3 bg-[var(--color-background)] border-b border-[var(--color-stone)]/10 z-30">
          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className="p-2 rounded-xl bg-[var(--color-primary-dark)] text-white"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-[var(--color-primary-dark)]/50">Admin Panel</span>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
