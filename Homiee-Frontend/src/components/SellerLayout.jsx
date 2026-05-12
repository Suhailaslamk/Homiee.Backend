import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SellerSidebar from '../pages/Seller/SellerSidebar';
import { motion } from 'framer-motion';

export default function SellerLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      {/* GLOBAL SELLER SIDEBAR */}
      <SellerSidebar />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-screen overflow-hidden relative bg-[var(--color-background)] min-w-0">
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
        
        <div className={`relative z-10 w-full ${location.pathname.includes('/chat') ? 'h-full p-0' : 'p-12 max-w-[1600px] mx-auto overflow-y-auto h-full'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
