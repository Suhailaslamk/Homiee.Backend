import React from 'react';
import { 
  LayoutDashboard, Store, Package, ClipboardList, 
  BadgeIndianRupee, LogOut, Home, MessageSquare,
  PlusCircle, Settings, HelpCircle, User,
  Sparkles, Compass, Layers, ShieldCheck,
  Plus, History, Wallet, UserCircle, LogOut as ExitIcon,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function SellerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Studio Pulse', path: '/seller/dashboard' },
    { icon: MessageSquare, label: 'Transmission Hub', path: '/seller/chat' },
    { icon: Layers, label: 'Inventory Registry', path: '/seller/inventory' },
    { icon: ClipboardList, label: 'Fulfillment Ledger', path: '/seller/orders' },
    { icon: Wallet, label: 'Financial Vault', path: '/seller/earnings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside className="w-[340px] bg-[var(--color-primary-dark)] h-screen sticky top-0 flex flex-col p-10 text-white z-50 shadow-2xl overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent)]/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />

      {/* Studio Branding */}
      <div className="relative z-10 flex flex-col gap-1 mb-20 px-2">
        <Link to="/" className="flex items-center gap-4 group mb-6">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center font-['Fraunces'] text-3xl font-bold group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-primary-dark)] transition-all text-[var(--color-accent)] shadow-2xl border border-white/10">
            H
          </div>
          <div>
            <span className="text-3xl font-['Fraunces'] font-semibold tracking-tighter block leading-none">Homiee</span>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mt-1 block">Artisan Network</span>
          </div>
        </Link>
        
        <div className="px-1 py-3 border-y border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 italic">Studio Online</span>
          </div>
          <ShieldCheck size={14} className="text-white/20" />
        </div>
      </div>

      {/* Navigation Registry */}
      <nav className="relative z-10 flex-1 space-y-3">
        <div className="mb-8 px-4 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 italic">Orchestration</span>
          <Compass size={14} className="text-white/10" />
        </div>
        
        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center justify-between p-5 rounded-[1.8rem] transition-all group relative overflow-hidden ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-2xl border border-white/10' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-5 font-bold tracking-tight text-sm relative z-10">
                  <item.icon size={22} className={isActive ? 'text-[var(--color-accent)]' : 'group-hover:text-[var(--color-accent)] transition-colors'} />
                  {item.label}
                </div>
                
                {isActive ? (
                  <motion.div 
                    layoutId="activeNavArtisan"
                    className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/10 to-transparent pointer-events-none"
                  />
                ) : (
                  <ChevronRight size={18} className="opacity-0 group-hover:opacity-20 transition-all group-hover:translate-x-1" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-16 mb-8 px-4 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 italic">Creation Protocol</span>
          <Sparkles size={14} className="text-white/10" />
        </div>
        
        <Link
          to="/seller/products/new"
          className="flex items-center justify-between p-6 rounded-[2rem] bg-[var(--color-accent)] text-[var(--color-primary-dark)] font-bold tracking-tight text-lg shadow-2xl shadow-[var(--color-accent)]/20 hover:scale-[1.03] active:scale-95 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-inner group-hover:rotate-90 transition-transform duration-500">
              <Plus size={24} />
            </div>
            <span>New Piece</span>
          </div>
          <ArrowRightCircle size={20} className="opacity-40 group-hover:opacity-100 transition-opacity" />
        </Link>
      </nav>

      {/* Session Governance */}
      <div className="relative z-10 pt-10 border-t border-white/5 space-y-2">
        <Link 
          to="/profile"
          className="flex items-center justify-between p-5 w-full rounded-2xl text-white/40 font-bold hover:text-white hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-4">
            <UserCircle size={20} className="group-hover:text-[var(--color-accent)]" /> 
            <span className="text-sm">Account Studio</span>
          </div>
          <Settings size={16} className="opacity-20 group-hover:rotate-90 transition-all" />
        </Link>
        
        <button 
          onClick={handleLogout}
          className="flex items-center justify-between p-5 w-full rounded-2xl text-white/40 font-bold hover:text-rose-400 hover:bg-rose-500/5 transition-all group"
        >
          <div className="flex items-center gap-4">
            <ExitIcon size={20} className="group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-sm">Exit Session</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-rose-500/20 group-hover:bg-rose-500 transition-colors" />
        </button>
      </div>
    </aside>
  );
}

function ArrowRightCircle({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="m12 8 4 4-4 4" />
    </svg>
  );
}
