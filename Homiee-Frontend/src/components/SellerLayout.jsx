import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import SellerSidebar from '../pages/Seller/SellerSidebar';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../api/profile';
import { Loader2, Menu, X } from 'lucide-react';

export default function SellerLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: profileResponse, isLoading, isError } = useQuery({
    queryKey: ['profile', 'seller-layout'],
    queryFn: getProfile,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const sellerStatus = profileResponse?.data?.seller?.status;

  if (!isLoading && !isError && sellerStatus !== 'Approved') {
    return <Navigate to="/seller/onboarding" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-[var(--color-primary)]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  const isChat = location.pathname.includes('/chat');

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
      {/* Sidebar */}
      <SellerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

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
          <span className="text-xs font-black uppercase tracking-widest text-[var(--color-primary-dark)]/50">Seller Studio</span>
        </header>

        {/* Page content */}
        <div className={`flex-1 overflow-hidden ${isChat ? 'flex flex-col' : 'overflow-y-auto'}`}>
          {isChat ? (
            <Outlet />
          ) : (
            <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto overflow-y-auto h-full">
              <Outlet />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
