import React from 'react';
import {
  LayoutDashboard, Users, Store,
  Settings, LogOut, Package, ListTree, ShoppingCart, X
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';

const NAV_GROUPS = [
  {
    title: 'Intelligence',
    items: [{ icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' }],
  },
  {
    title: 'Governance',
    items: [
      { icon: Store, label: 'Sellers', path: '/admin/sellers' },
      { icon: Users, label: 'Customers', path: '/admin/customers' },
    ],
  },
  {
    title: 'Orchestration',
    items: [
      { icon: Package, label: 'Products', path: '/admin/products' },
      { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
      { icon: ListTree, label: 'Categories', path: '/admin/categories' },
    ],
  },
];

// ─── Sub-component (called as <NavContent /> not stored as a variable) ─────────
function NavContent({ pathname, onClose, onLogout, onSettings, showClose }) {
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
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)] mt-0.5 block">Admin Panel</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_6px_var(--color-accent)]" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Online</span>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto space-y-5 pr-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-0.5">
            <p className="px-3 text-[8px] font-black uppercase tracking-[0.3em] text-white/25 mb-1.5">{group.title}</p>
            {group.items.map((item) => {
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
        ))}
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-white/10 space-y-0.5 mt-4">
        <button
          onClick={() => onSettings()}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all"
        >
          <Settings size={16} />
          Settings
          <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/10">Soon</span>
        </button>
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
export default function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

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
    onSettings: () => toast.info('Settings coming soon.'),
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
