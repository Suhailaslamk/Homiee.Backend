import React from 'react';
import {
  LayoutDashboard, ClipboardList,
  LogOut, MessageSquare,
  Settings, Sparkles, Layers,
  Plus, Wallet, X
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/seller/dashboard' },
  { icon: MessageSquare, label: 'Messages', path: '/seller/chat' },
  { icon: Layers, label: 'Products', path: '/seller/inventory' },
  { icon: ClipboardList, label: 'Orders', path: '/seller/orders' },
  { icon: Wallet, label: 'Earnings', path: '/seller/earnings' },
];

// ─── Sub-component (called as <NavContent /> not stored as a variable) ─────────
function NavContent({ pathname, onClose, onLogout, showClose }) {
  return (
    <div className="flex flex-col h-full p-5">
      {/* Mobile close button */}
      {showClose && (
        <button
          onClick={() => onClose()}
          className="absolute top-4 right-4 z-[60] p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      )}

      {/* Branding */}
      <div className="mb-8 pt-2">
        <Link to="/" onClick={() => onClose()} className="flex items-center gap-3 group mb-5">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-['Fraunces'] text-xl font-bold text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-primary-dark)] transition-all border border-white/10 shrink-0">
            H
          </div>
          <div>
            <span className="text-lg font-['Fraunces'] font-semibold tracking-tight block leading-none">Homiee</span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)] mt-0.5 block">Seller Studio</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Studio Online</span>
          <Sparkles size={11} className="ml-auto text-white/20" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto pr-1">
        <p className="px-3 text-[8px] font-black uppercase tracking-[0.3em] text-white/25 mb-2">Navigation</p>
        <div className="space-y-0.5">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => onClose()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative overflow-hidden ${
                  isActive
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={16} className={isActive ? 'text-[var(--color-accent)]' : ''} />
                {item.label}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/10 to-transparent pointer-events-none" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="pt-4 mt-2">
          <Link
            to="/seller/products/new"
            onClick={() => onClose()}
            className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-xl bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all"
          >
            <Plus size={15} /> Add Product
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-white/10 space-y-0.5 mt-4">
        <Link
          to="/seller/settings"
          onClick={() => onClose()}
          className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold transition-all ${
            pathname === '/seller/settings'
              ? 'bg-white/10 text-white border border-white/10'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings size={16} className={pathname === '/seller/settings' ? 'text-[var(--color-accent)]' : ''} />
          Settings
        </Link>
        <button
          onClick={() => onLogout()}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function SellerSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (window.innerWidth < 1024) onClose();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const props = {
    pathname: location.pathname,
    onClose,
    onLogout: handleLogout,
  };

  return (
    <>
      {/* ── DESKTOP: static flex child, always visible ── */}
      <aside className="hidden lg:flex lg:flex-col lg:shrink-0 w-64 xl:w-72 bg-[var(--color-primary-dark)] text-white">
        <NavContent {...props} showClose={false} />
      </aside>

      {/* ── MOBILE OVERLAY ── */}
      <div
        onClick={() => onClose()}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── MOBILE DRAWER ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[var(--color-primary-dark)] text-white flex flex-col
          transition-transform duration-300 ease-in-out lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <NavContent {...props} showClose={true} />
      </aside>
    </>
  );
}
