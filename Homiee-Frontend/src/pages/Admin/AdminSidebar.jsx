import React from 'react';
import { 
  LayoutDashboard, Users, Store, ShieldCheck, 
  Settings, BarChart3, LogOut, Package, ListTree, ShoppingCart, Home,
  Compass, Globe, Layers, ShieldAlert, History, UserCircle,
  ChevronRight, Sparkles, Activity, Search
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../hooks/useToast';

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  
  const groups = [
    {
      title: 'Intelligence',
      icon: Activity,
      items: [
        { icon: LayoutDashboard, label: 'Marketplace Signal', path: '/admin/dashboard' },
      ]
    },
    {
      title: 'Governance',
      icon: ShieldCheck,
      items: [
        { icon: Store, label: 'Artisan Vetting', path: '/admin/sellers' },
        { icon: Users, label: 'Patron Registry', path: '/admin/customers' },
      ]
    },
    {
      title: 'Orchestration',
      icon: Compass,
      items: [
        { icon: Package, label: 'Exhibition Audit', path: '/admin/products' },
        { icon: ShoppingCart, label: 'Acquisition Logs', path: '/admin/orders' },
        { icon: ListTree, label: 'Collection Schema', path: '/admin/categories' },
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside className="w-[340px] bg-[var(--color-primary-dark)] h-screen sticky top-0 flex flex-col p-10 text-white z-50 shadow-2xl overflow-hidden border-r border-white/5">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--color-accent)]/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 blur-[120px] rounded-full -ml-40 -mb-40 pointer-events-none" />

      {/* Governor Branding */}
      <div className="relative z-10 flex flex-col gap-1 mb-16 px-2">
        <Link to="/" className="flex items-center gap-5 group mb-8">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.8rem] flex items-center justify-center font-['Fraunces'] text-4xl font-bold group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-primary-dark)] transition-all text-[var(--color-accent)] shadow-2xl border border-white/10">
            H
          </div>
          <div>
            <span className="text-3xl font-['Fraunces'] font-semibold tracking-tighter block leading-none">Homiee</span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mt-1.5 block">Marketplace Governor</span>
          </div>
        </Link>
        
        <div className="px-1 py-4 border-y border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_10px_var(--color-accent)]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 italic">Ecosystem Online</span>
          </div>
          <Globe size={16} className="text-white/20 animate-spin-slow" />
        </div>
      </div>

      {/* Navigation Registry */}
      <nav className="relative z-10 flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-10">
        {groups.map((group, gIdx) => (
          <div key={group.title} className="space-y-4">
            <div className="px-4 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">{group.title}</span>
              <group.icon size={14} className="text-white/10" />
            </div>
            
            <div className="space-y-2">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center justify-between p-5 rounded-[2rem] transition-all group relative overflow-hidden ${
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
                        layoutId="activeNavGovernor"
                        className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/10 to-transparent pointer-events-none"
                      />
                    ) : (
                      <ChevronRight size={18} className="opacity-0 group-hover:opacity-20 transition-all group-hover:translate-x-1" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Rapid Orchestration */}
        <div className="mt-12 px-4 space-y-4">
          <div className="px-1 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Rapid Search</span>
            <Search size={14} className="text-white/10" />
          </div>
          <div className="relative group">
            <input 
              disabled
              placeholder="Registry Lookup..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white/40 cursor-not-allowed group-hover:bg-white/10 transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          </div>
        </div>
      </nav>

      {/* Session Governance */}
      <div className="relative z-10 pt-10 border-t border-white/5 space-y-2">
        <button 
          onClick={() => toast.info('Platform settings are currently being optimized.')}
          className="flex items-center justify-between p-5 w-full rounded-2xl text-white/40 font-bold hover:text-white hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-4">
            <Settings size={20} className="group-hover:rotate-90 transition-all" /> 
            <span className="text-sm">Platform Settings</span>
          </div>
          <div className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white/5 group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-primary-dark)] transition-all">Soon</div>
        </button>
        
        <button 
          onClick={handleLogout}
          className="flex items-center justify-between p-5 w-full rounded-2xl text-white/40 font-bold hover:text-rose-400 hover:bg-rose-500/5 transition-all group"
        >
          <div className="flex items-center gap-4">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-sm">Terminate Session</span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 group-hover:bg-rose-500 transition-colors" />
        </button>
      </div>
    </aside>
  );
}
