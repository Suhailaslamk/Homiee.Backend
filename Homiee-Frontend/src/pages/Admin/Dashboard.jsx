import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Boxes, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Activity, 
  ArrowRight,
  ShieldCheck,
  Package,
  TrendingUp,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Compass,
  Layers,
  ShieldAlert,
  Globe,
  Zap,
  Sparkles,
  History,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import SurfaceCard from '../../components/SurfaceCard';
import StatePanel from '../../components/StatePanel';
import StatusPill from '../../components/StatusPill';
import { getAdminAnalyticsKpis, getAdminAnalytics, getAdminOrders, getAdminSellers } from '../../api/admin';
import { getPagedItems, getResponseData } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/format';

export default function AdminDashboard() {
  const { data: kpisResponse, isLoading: isLoadingKpis, error: kpisError, refetch: refetchKpis } = useQuery({
    queryKey: ['admin-analytics-kpis'],
    queryFn: getAdminAnalyticsKpis,
  });

  const { data: analyticsResponse, isLoading: isLoadingAnalytics, error: analyticsError, refetch: refetchAnalytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: getAdminAnalytics,
  });

  const { data: sellersResponse } = useQuery({
    queryKey: ['admin-sellers-preview'],
    queryFn: () => getAdminSellers({ page: 1, pageSize: 5, status: 'Submitted' }),
  });

  const { data: ordersResponse } = useQuery({
    queryKey: ['admin-orders-preview'],
    queryFn: () => getAdminOrders({ page: 1, pageSize: 5 }),
  });

  const kpis = getResponseData(kpisResponse) || {
    totalUsers: 0,
    totalSellers: 0,
    totalOrders: 0,
    totalRevenue: 0,
  };
  
  const analyticsRaw = getResponseData(analyticsResponse) || {};
  const revenueSeries = analyticsRaw.revenueLast30Days || [];
  const categorySeries = analyticsRaw.topCategories || [];
  const userSeries = analyticsRaw.newUsersLast30Days || [];
  const orderStatusSeries = analyticsRaw.ordersByStatus || [];
  
  const sellers = getPagedItems(sellersResponse);
  const orders = getPagedItems(ordersResponse);

  const COLORS = ['var(--color-accent)', 'var(--color-primary-dark)', '#b85c38', '#516654', '#d3a688'];

  const isLoading = isLoadingKpis || isLoadingAnalytics;
  const isError = kpisError || analyticsError;

  const headlineStats = useMemo(() => [
    { label: 'Ecosystem Patrons', value: kpis.totalUsers, hint: 'All registered curators', icon: Users, trend: '+12.4%', isPositive: true, accent: 'sand' },
    { label: 'Artisan Studio Network', value: kpis.totalSellers, hint: 'Verified craft businesses', icon: ShieldCheck, trend: '+5.1%', isPositive: true, accent: 'forest' },
    { label: 'Acquisition Volume', value: kpis.totalOrders, hint: 'Total platform conversions', icon: ShoppingBag, trend: '+8.2%', isPositive: true, accent: 'accent' },
    { label: 'Exhibition Listings', value: kpis.totalProducts ?? 124, hint: 'Active creative assets', icon: Package, trend: '+15.7%', isPositive: true, accent: 'terracotta' },
  ], [kpis]);

  if (isLoading) return <DashboardLoading />;

  return (
    <div className="space-y-16 pb-24 px-6 pt-10">
      {/* Global Signal Header */}
      <section className="relative overflow-hidden rounded-[4rem] bg-white border border-[var(--color-stone)]/5 shadow-2xl p-10 sm:p-16">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-accent)] blur-[150px] rounded-full -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--color-primary-dark)] blur-[150px] rounded-full -ml-64 -mb-64" />
        </div>

        <div className="relative flex flex-col xl:flex-row items-center justify-between gap-12">
          <div className="max-w-3xl text-center xl:text-left">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[var(--color-sand)]/30 border border-[var(--color-stone)]/5 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-primary-dark)] mb-10">
              <Globe size={14} className="text-[var(--color-accent)] animate-spin-slow" />
              Global Marketplace Orchestration
            </div>
            
            <h1 className="text-6xl sm:text-7xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tighter leading-tight">
              Marketplace <i className="text-[var(--color-accent)]">Signal.</i>
            </h1>
            <p className="mt-8 text-2xl text-[var(--color-stone)] font-medium italic opacity-70 leading-relaxed max-w-2xl">
              "Governing the Homiee artisanal ecosystem. Monitoring global resonance, artisan vetting, and acquisition momentum."
            </p>
          </div>
          
          <div className="flex flex-col items-center xl:items-end bg-[var(--color-primary-dark)] p-12 rounded-[4rem] shadow-2xl min-w-[360px] relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="text-[11px] font-bold uppercase tracking-[0.4em] text-white/40 mb-6 italic">Global Platform Revenue</div>
            <div className="text-7xl font-['Fraunces'] font-bold text-[var(--color-accent)] tracking-tighter">{formatCurrency(kpis.totalRevenue)}</div>
            <div className="mt-8 flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[11px] font-black uppercase tracking-widest border border-emerald-500/20">
              <TrendingUp size={16} /> +18.9% Ecosystem Growth
            </div>
          </div>
        </div>
      </section>

      {/* Orchestration Orbs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {headlineStats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <OrbCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Category Distribution */}
        <SurfaceCard className="bg-white p-12 shadow-2xl rounded-[4rem]">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Curatorial Focus</h3>
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2">Revenue contribution by artisan category</p>
            </div>
            <Layers size={24} className="text-[var(--color-accent)]" />
          </div>
          <div className="h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={categorySeries}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="totalRevenue"
                  nameKey="name"
                >
                  {categorySeries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                  formatter={(val) => [formatCurrency(val), 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {categorySeries.slice(0, 4).map((cat, idx) => (
              <div key={cat.categoryId} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-[10px] font-bold text-[var(--color-primary-dark)] truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </SurfaceCard>

        {/* Growth Trajectory */}
        <SurfaceCard className="bg-white p-12 shadow-2xl rounded-[4rem]">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Ecosystem Growth</h3>
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2">Daily registration cadence for patrons & artisans</p>
            </div>
            <TrendingUp size={24} className="text-emerald-500" />
          </div>
          <div className="h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={userSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="date" hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="customers" fill="var(--color-accent)" radius={[10, 10, 0, 0]} name="Curators" />
                <Bar dataKey="sellers" fill="var(--color-primary-dark)" radius={[10, 10, 0, 0]} name="Artisans" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>
      </div>

      {/* Primary Intelligence Row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr,0.5fr] gap-16">
        <SurfaceCard className="bg-white/40 backdrop-blur-3xl border-white p-12 shadow-2xl rounded-[4rem]">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h2 className="text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Ecosystem Resonance</h2>
              <p className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2 italic">Platform-wide transaction trajectory across 30 cycles</p>
            </div>
            <div className="w-16 h-16 rounded-[2rem] bg-[var(--color-sand)]/50 flex items-center justify-center text-[var(--color-primary-dark)] shadow-inner">
              <Activity size={32} />
            </div>
          </div>

          <div className="h-[450px] w-full min-h-[450px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={100} minWidth={0}>
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="colorRevenueGlobal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-stone-light)" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  hide
                />
                <YAxis 
                  hide 
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '32px', 
                    border: '1px solid rgba(255,255,255,0.5)', 
                    boxShadow: '0 40px 60px -15px rgba(0,0,0,0.15)',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(16px)',
                    padding: '24px'
                  }}
                  itemStyle={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', fontSize: '14px' }}
                  cursor={{ stroke: 'var(--color-accent)', strokeWidth: 2, strokeDasharray: '6 6' }}
                  formatter={(val) => [formatCurrency(val), 'Global Revenue Signal']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--color-accent)" 
                  strokeWidth={6} 
                  fillOpacity={1} 
                  fill="url(#colorRevenueGlobal)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mt-16 pt-16 border-t border-[var(--color-stone)]/5">
            <GovernanceInsight label="Avg Signal Value" value={formatCurrency(kpis.totalRevenue / (kpis.totalOrders || 1))} icon={Zap} />
            <GovernanceInsight label="Network Status" value="Optimized" icon={ShieldCheck} />
            <GovernanceInsight label="Active Vetting" value={`${sellers.length} Protocols`} icon={Clock} />
          </div>
        </SurfaceCard>

        {/* Governance Activity */}
        <div className="space-y-12">
          <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 shadow-xl rounded-[4rem]">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Artisan Vetting</h3>
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2">New studio applications awaiting curation</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-sand)]/50 flex items-center justify-center text-[var(--color-accent)]">
                <Compass size={24} />
              </div>
            </div>
            
            <div className="space-y-6">
              {sellers.length === 0 ? (
                <EmptySignal icon={ShieldAlert} title="Registry Quiescent" description="No studio applications currently in the vetting queue." />
              ) : (
                sellers.map((seller) => (
                  <Link 
                    key={seller.userId} 
                    to={`/admin/sellers/${seller.userId}`}
                    className="flex items-center justify-between p-6 rounded-[2.5rem] bg-[var(--color-sand)]/10 border border-[var(--color-stone)]/5 hover:border-[var(--color-accent)]/20 hover:bg-white hover:shadow-2xl transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-[var(--color-primary-dark)] text-white rounded-2xl flex items-center justify-center font-['Fraunces'] text-xl font-bold group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-primary-dark)] transition-all shadow-xl">
                        {seller.businessName[0]}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent)] transition-colors">{seller.businessName}</div>
                        <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1 italic">Awaiting Protocol</div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-[var(--color-stone)]/20 group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all" />
                  </Link>
                ))
              )}
            </div>
            
            <Link to="/admin/sellers" className="mt-8 block py-4 text-center text-[11px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)] hover:tracking-[0.4em] transition-all border-t border-[var(--color-stone)]/5">
              Review Full Registry
            </Link>
          </SurfaceCard>

          <SurfaceCard className="bg-[var(--color-primary-dark)] text-white p-10 rounded-[4rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-accent)]/10 blur-[80px] rounded-full -mr-24 -mt-24 group-hover:bg-[var(--color-accent)]/20 transition-all duration-700" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold flex items-center gap-3 text-[var(--color-accent)]">
                  <History size={24} />
                  Acquisition Log
                </h3>
                <Link to="/admin/orders" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">Global Audit</Link>
              </div>
              
              <div className="space-y-5">
                {orders.length === 0 ? (
                  <p className="text-center py-10 text-white/20 italic text-sm">Ecosystem quiescent.</p>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-[var(--color-accent)] border border-white/10">
                          <ShoppingBag size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white/80">#{String(order.id).slice(-6)}</div>
                          <div className="text-[11px] font-black uppercase tracking-widest text-[var(--color-accent)] mt-1">{formatCurrency(order.totalAmount)}</div>
                        </div>
                      </div>
                      <StatusPill value={order.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}

function OrbCard({ label, value, hint, icon: Icon, trend, isPositive, accent }) {
  const themes = {
    sand: 'bg-[var(--color-sand)]/50 text-[var(--color-primary-dark)] border-[var(--color-stone)]/5',
    forest: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    accent: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/10',
    terracotta: 'bg-orange-50 text-orange-600 border-orange-100',
  };

  return (
    <SurfaceCard className="bg-white border-[var(--color-stone)]/5 shadow-xl transition-all hover:-translate-y-2 p-10 rounded-[3.5rem] group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--color-sand)]/20 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
      
      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110 ${themes[accent]}`}>
          <Icon size={28} />
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ${isPositive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend}
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] italic">{label}</p>
        <p className="mt-3 text-5xl font-['Fraunces'] font-bold text-[var(--color-primary-dark)] tracking-tighter">{value}</p>
        <p className="mt-4 text-[10px] font-medium text-[var(--color-text-muted)] italic opacity-70 leading-relaxed">{hint}</p>
      </div>
    </SurfaceCard>
  );
}

function GovernanceInsight({ label, value, icon: Icon }) {
  return (
    <div className="group cursor-default">
      <div className="flex items-center gap-2 mb-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors">
        <Icon size={18} />
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] italic">{label}</span>
      </div>
      <p className="text-3xl font-bold text-[var(--color-primary-dark)] tracking-tighter leading-tight">{value}</p>
    </div>
  );
}

function EmptySignal({ icon: Icon, title, description }) {
  return (
    <div className="py-16 text-center bg-[var(--color-sand)]/5 border-2 border-dashed border-[var(--color-stone)]/10 rounded-[3rem]">
      <div className="w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center mx-auto text-[var(--color-stone)]/20 mb-6 border border-[var(--color-stone)]/5 shadow-xl">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">{title}</h3>
      <p className="text-xs text-[var(--color-text-muted)] mt-2 italic max-w-[200px] mx-auto">{description}</p>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-16 animate-pulse px-6">
      <div className="h-72 rounded-[4rem] bg-[var(--color-sand)]/20" />
      <div className="grid grid-cols-4 gap-10">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-64 rounded-[3.5rem] bg-[var(--color-sand)]/20" />)}
      </div>
      <div className="grid grid-cols-[1.5fr,0.5fr] gap-16">
        <div className="h-[600px] bg-[var(--color-sand)]/20 rounded-[4rem]" />
        <div className="space-y-12">
          <div className="h-64 bg-[var(--color-sand)]/20 rounded-[3.5rem]" />
          <div className="h-64 bg-[var(--color-sand)]/20 rounded-[3.5rem]" />
        </div>
      </div>
    </div>
  );
}


