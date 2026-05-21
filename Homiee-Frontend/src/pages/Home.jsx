import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  User, 
  ArrowRight, 
  Star, 
  ShoppingBag, 
  Scissors, 
  Coffee, 
  Palette, 
  Heart, 
  Sparkles 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/marketplace';
import { getCurrentRole, isSellerRole, isCustomerRole, isAdminRole, getCurrentUserId } from '../utils/auth';

export default function Home() {
  const navigate = useNavigate();
  const role = getCurrentRole();

  // 1. SELLER HOME VIEW
  if (isSellerRole(role)) {
    return <SellerHomeView navigate={navigate} />;
  }

  // 2. ADMIN HOME VIEW
  if (isAdminRole(role)) {
    return <AdminHomeView navigate={navigate} />;
  }

  // 3. CUSTOMER/GUEST HOME VIEW
  return <GuestHomeView navigate={navigate} />;
}

// --- VIEW COMPONENTS ---

function SellerHomeView({ navigate }) {
  const currentUserId = getCurrentUserId();

  return (
    <div className="min-h-screen bg-[var(--color-background)] pt-32 pb-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 grain-bg opacity-5" />
      <div className="mx-auto max-w-7xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-stone)]/30 bg-white/50 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-accent)] mb-8 shadow-sm">
            <Sparkles size={14} className="fill-[var(--color-accent)]" /> Seller Dashboard
          </div>
          <h1 className="text-4xl sm:text-7xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-8 leading-tight">
            Welcome back to your <i className="text-[var(--color-accent)]">shop.</i>
          </h1>
          <p className="text-lg sm:text-xl leading-relaxed text-[var(--color-text-muted)] mb-12 font-medium max-w-2xl">
            Your products are being updated. Manage your shop, check your orders, and grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            <button 
              onClick={() => navigate('/seller/dashboard')}
              className="px-10 py-5 bg-[var(--color-primary-dark)] text-white rounded-full font-bold text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Go to Dashboard <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => navigate('/seller/orders')}
              className="px-10 py-5 bg-white border border-[var(--color-stone)]/10 text-[var(--color-primary-dark)] rounded-full font-bold text-lg shadow-xl hover:bg-[var(--color-sand)]/20 transition-all"
            >
              Recent Orders
            </button>
          </div>
        </motion.div>

        {/* Studio Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-24">
          <QuickActionCard 
            icon={<Palette size={32} />} 
            title="Manage Products" 
            desc="Add new products or update your inventory levels."
            onClick={() => navigate('/seller/inventory')}
          />
          <QuickActionCard 
            icon={<ShoppingBag size={32} />} 
            title="Pending Orders" 
            desc="Review and manage your latest customer orders."
            onClick={() => navigate('/seller/orders')}
          />
          <QuickActionCard 
            icon={<Store size={32} />} 
            title="View Store" 
            desc="See how customers view your shop and products."
            onClick={() => navigate(`/store/${currentUserId}`)} 
          />
        </div>
      </div>
    </div>
  );
}

function AdminHomeView({ navigate }) {
  return (
    <div className="min-h-screen bg-[var(--color-primary-dark)] pt-32 pb-24 px-6 relative overflow-hidden text-white">
      <div className="absolute inset-0 grain-bg opacity-10" />
      <div className="mx-auto max-w-7xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-accent)] mb-10">
            <User size={14} /> System Administrator
          </div>
          <h1 className="text-5xl sm:text-6xl font-['Fraunces'] font-semibold mb-8">Admin Dashboard</h1>
          <p className="text-xl text-white/60 mb-12 leading-relaxed">
            Manage sellers, monitor marketplace activity, and update platform categories.
          </p>
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="px-12 py-6 bg-[var(--color-accent)] text-white rounded-full font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            Go to Admin Panel
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function GuestHomeView({ navigate }) {
  const { data: categoriesResponse } = useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: getCategories,
  });

  const categories = (categoriesResponse?.data ?? []).slice(0, 4);

  return (
    <div className="min-h-screen bg-[var(--color-background)] selection:bg-[var(--color-accent)] selection:text-white overflow-hidden">
      
      {/* LOCAL STYLES FOR ANIMATIONS */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .grain-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.04;
          mix-blend-mode: multiply;
          pointer-events: none;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(var(--rotation)); }
          50% { transform: translateY(-10px) rotate(calc(var(--rotation) + 2deg)); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-[var(--color-primary-light)]/10 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-[var(--color-accent)]/10 blur-[100px]" />
          <div className="absolute inset-0 grain-bg" />
        </div>

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-stone)]/30 bg-white/50 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-primary)] mb-8 shadow-sm">
                <Star size={14} className="text-[var(--color-accent)] fill-[var(--color-accent)]" />
                Premium Local Marketplace
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-['Fraunces'] font-semibold tracking-tight text-[var(--color-primary-dark)] mb-8 leading-[1.05]">
                Where home businesses <i className="text-[var(--color-accent)] font-medium">bloom.</i>
              </h1>
              <p className="text-lg leading-relaxed text-[var(--color-text-muted)] mb-12 max-w-xl font-medium">
                Discover exceptional handcrafted goods and support creators in your neighborhood. Curated quality, delivered locally.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={() => navigate('/discovery')} 
                  className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-full bg-[var(--color-accent)] px-8 py-4 font-bold text-white shadow-lg shadow-[var(--color-accent)]/30 transition-all hover:scale-105 active:scale-95"
                >
                  Shop Local <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => navigate('/signup/seller')} 
                  className="w-full sm:w-auto rounded-full border-2 border-[var(--color-primary)]/20 px-8 py-4 font-bold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)]/5 active:scale-95"
                >
                  Start Selling
                </button>
              </div>
            </motion.div>

            <div className="relative h-[500px] hidden md:block">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 glass rounded-[2rem] p-4 shadow-2xl z-20 animate-float" style={{"--rotation": "0deg"}}>
                <div className="aspect-[4/5] rounded-[1.5rem] bg-stone-200 overflow-hidden mb-4">
                  <img src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800" alt="Art" className="w-full h-full object-cover" />
                </div>
                <div className="px-2">
                  <h3 className="font-['Fraunces'] font-bold text-xl text-[var(--color-primary-dark)]">Artisanal Ceramic</h3>
                  <p className="text-lg font-bold text-[var(--color-accent)] mt-2">$45.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee and Categories as before... */}
      <section className="py-12 border-y border-[var(--color-primary)]/10 bg-[var(--color-surface)] overflow-hidden">
        <div className="flex w-[200%] sm:w-auto">
          <div className="flex animate-marquee whitespace-nowrap items-center gap-12 sm:gap-24 px-6 sm:px-12">
            <MarqueeItem text="500+ Local Artisans" icon={User} />
            <MarqueeItem text="10,000+ Unique Products" icon={ShoppingBag} />
            <MarqueeItem text="Handmade with Love" icon={Heart} />
            <MarqueeItem text="Verified Creators" icon={Store} />
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-4xl sm:text-5xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-16">
            Shop by <i className="text-[var(--color-accent)]">Category</i>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {categories.map((cat, idx) => {
              const bgs = ['bg-[#d2d9d4]', 'bg-[#f0e4dc]', 'bg-[#e4dfd8]', 'bg-[#dce5e4]'];
              const icons = [Store, Coffee, Sparkles, Scissors];
              return (
                <CategoryCard 
                  key={cat.id}
                  onClick={() => navigate(`/discovery?category=${cat.name}`)} 
                  title={cat.name} 
                  icon={icons[idx % icons.length]} 
                  bg={bgs[idx % bgs.length]} 
                />
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

// --- SHARED SUBCOMPONENTS ---

function QuickActionCard({ icon, title, desc, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="group p-10 bg-white border border-[var(--color-stone)]/5 rounded-[3rem] text-left transition-all hover:shadow-[var(--shadow-float)] hover:-translate-y-2"
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-sand)]/20 text-[var(--color-primary-dark)] flex items-center justify-center mb-8 group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-2xl font-['Fraunces'] font-bold text-[var(--color-primary-dark)] mb-3">{title}</h3>
      <p className="text-[var(--color-text-muted)] font-medium leading-relaxed">{desc}</p>
    </button>
  );
}

const MarqueeItem = ({ text, icon: Icon }) => (
  <div className="flex items-center gap-4 text-[var(--color-primary)]/80">
    <Icon size={24} className="text-[var(--color-accent)]" />
    <span className="font-['Fraunces'] text-2xl font-medium tracking-tight">{text}</span>
  </div>
);

const CategoryCard = ({ title, icon: Icon, bg, onClick }) => (
  <div 
    onClick={onClick}
    className={`group relative rounded-3xl overflow-hidden cursor-pointer ${bg} p-8 aspect-square flex flex-col justify-between transition-all hover:scale-[1.05] shadow-sm`}
  >
    <div className="bg-white/40 backdrop-blur-sm w-12 h-12 rounded-xl flex items-center justify-center text-[var(--color-primary-dark)]">
      <Icon size={24} />
    </div>
    <h3 className="font-['Fraunces'] text-xl font-semibold text-[var(--color-primary-dark)]">{title}</h3>
  </div>
);

