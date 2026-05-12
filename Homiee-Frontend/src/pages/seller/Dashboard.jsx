import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeIndianRupee,
  Box,
  ChartColumn,
  CircleCheckBig,
  ClipboardList,
  Clock3,
  Package,
  ShoppingBag,
  Star,
  TriangleAlert,
  LayoutGrid,
  TrendingUp,
  ArrowUpRight,
  TrendingDown,
  Activity,
  Award,
  Plus,
  Zap,
  Sparkles,
  ArrowRightCircle,
  ShieldCheck,
  Compass,
  Layers,
  History,
  CheckCircle2,
  Settings,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import StatePanel from '../../components/StatePanel';
import StatusPill from '../../components/StatusPill';
import SurfaceCard from '../../components/SurfaceCard';
import { getSellerAnalytics, getSellerDashboard, getSellerEarnings, getDeliveryCalendar } from '../../api/seller';
import { getResponseData } from '../../utils/api';
import { formatCurrency } from '../../utils/format';

export default function SellerDashboard() {
  const {
    data: dashboardResponse,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: getSellerDashboard,
  });

  const {
    data: analyticsResponse,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ['seller-analytics', { days: 30, topN: 5 }],
    queryFn: () => getSellerAnalytics({ days: 30, topN: 5 }),
  });

  const {
    data: earningsResponse,
    isLoading: earningsLoading,
    error: earningsError,
    refetch: refetchEarnings,
  } = useQuery({
    queryKey: ['seller-earnings-preview', { page: 1, pageSize: 5 }],
    queryFn: () => getSellerEarnings({ page: 1, pageSize: 5 }),
  });

  const {
    data: calendarResponse,
    isLoading: calendarLoading,
  } = useQuery({
    queryKey: ['seller-delivery-calendar', new Date().getMonth() + 1, new Date().getFullYear()],
    queryFn: () => getDeliveryCalendar(new Date().getMonth() + 1, new Date().getFullYear()),
  });

  const dashboard = getResponseData(dashboardResponse) ?? {};
  const calendarDays = getResponseData(calendarResponse) ?? [];
  const analytics = getResponseData(analyticsResponse) ?? {};
  const earnings = getResponseData(earningsResponse) ?? {};
  const kpis = analytics.kpis ?? {};
  const revenueSeries = analytics.revenueLast30Days ?? [];
  const lowStockProducts = analytics.lowStockProducts ?? [];
  const recentOrders = analytics.recentOrders ?? [];
  const topProducts = analytics.topProducts ?? [];
  const earningsSummary = analytics.earnings ?? {};

  const headlineStats = useMemo(
    () => [
      {
        label: 'Exhibit Inventory',
        value: dashboard.totalProducts ?? kpis.totalProducts ?? 0,
        hint: `${kpis.activeProducts ?? 0} active signals`,
        icon: Layers,
        accent: 'sand',
      },
      {
        label: 'Acquisition Flow',
        value: dashboard.totalOrders ?? kpis.totalOrders ?? 0,
        hint: `${kpis.ordersToday ?? 0} new today`,
        icon: ShoppingBag,
        accent: 'forest',
      },
      {
        label: 'Awaiting Fulfillment',
        value: kpis.pendingOrders ?? 0,
        hint: `${kpis.deliveredOrders ?? 0} fulfilled`,
        icon: Clock3,
        accent: 'accent',
      },
      {
        label: 'Stock Registry',
        value: dashboard.lowStockProducts ?? kpis.lowStockProducts ?? 0,
        hint: `${kpis.outOfStockProducts ?? 0} voided`,
        icon: TriangleAlert,
        accent: 'rose',
      },
    ],
    [dashboard, kpis]
  );

  const pageLoading = dashboardLoading || analyticsLoading || earningsLoading;
  const pageError = dashboardError || analyticsError || earningsError;

  return (
    <div className="space-y-16 pb-24 px-6 pt-10">
      {pageLoading ? (
        <DashboardLoading />
      ) : pageError ? (
        <StatePanel
          className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
          message={(
            <div className="text-center">
              <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-6">Studio Synchronization Failure</p>
              <button onClick={() => refetchDashboard()} className="px-10 py-5 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Reconnect Studio</button>
            </div>
          )}
        />
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-16"
        >
          {/* Studio Pulse Hero */}
          <section className="relative overflow-hidden rounded-[4rem] bg-white border border-[var(--color-stone)]/5 shadow-2xl p-10 sm:p-16">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-accent)] blur-[120px] rounded-full -mr-48 -mt-48" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--color-primary-dark)] blur-[120px] rounded-full -ml-48 -mb-48" />
            </div>

            <div className="relative flex flex-col xl:flex-row items-center justify-between gap-12">
              <div className="max-w-2xl text-center xl:text-left">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[var(--color-sand)]/30 border border-[var(--color-stone)]/5 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-primary-dark)] mb-8">
                  <ShieldCheck size={14} className="text-[var(--color-accent)]" />
                  Artisan Studio Management Center
                </div>
                
                <h1 className="text-5xl sm:text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tighter leading-tight">
                  Studio <i className="text-[var(--color-accent)]">Pulse</i>
                </h1>
                <p className="mt-6 text-xl text-[var(--color-stone)] font-medium italic opacity-70 leading-relaxed">
                  "Your creative orchestration and performance registry, curated for the master artisan."
                </p>
              </div>
              
              <div className="flex flex-col items-center xl:items-end bg-[var(--color-primary-dark)] p-10 rounded-[3.5rem] shadow-2xl min-w-[320px] relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mb-4 italic">Cycle Revenue Registry</div>
                <div className="text-6xl font-['Fraunces'] font-bold text-[var(--color-accent)] tracking-tighter">{formatCurrency(kpis.revenueThisMonth ?? 0)}</div>
                <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  <TrendingUp size={14} /> +14.2% Optimization
                </div>
              </div>
            </div>
          </section>

          {/* Management Orbs */}
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {headlineStats.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <OrbCard {...item} />
              </motion.div>
            ))}
          </div>

          <div className="grid gap-16 xl:grid-cols-[1.5fr,0.5fr]">
            {/* Revenue Canvas */}
            <SurfaceCard className="bg-white/40 backdrop-blur-3xl border-white p-12 shadow-2xl rounded-[4rem]">
              <div className="flex items-center justify-between mb-16">
                <div>
                  <h2 className="text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Studio Signal</h2>
                  <p className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2 italic">Historical acquisition resonance over 30 cycles</p>
                </div>
                <div className="w-16 h-16 rounded-[1.8rem] bg-[var(--color-sand)]/50 flex items-center justify-center text-[var(--color-primary-dark)] shadow-inner">
                  <Compass size={32} />
                </div>
              </div>

              <div className="h-[400px] w-full min-w-0">
                {revenueSeries.length === 0 ? (
                  <EmptyBlock icon={Activity} title="Generating Resonance..." description="Your studio signal will populate as acquisitions occur." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueSeries}>
                      <defs>
                        <linearGradient id="colorRevenueArtisan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-stone-light)" opacity={0.3} />
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={['auto', 'auto']} />
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
                        formatter={(value) => [formatCurrency(value), 'Resonance Value']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="var(--color-accent)" 
                        strokeWidth={5}
                        fillOpacity={1} 
                        fill="url(#colorRevenueArtisan)" 
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mt-16 pt-16 border-t border-[var(--color-stone)]/5">
                <StudioInsight label="Mean Acquisition" value={formatCurrency(kpis.revenueThisMonth / (kpis.totalOrders || 1))} icon={Zap} />
                <StudioInsight label="Portfolio Health" value="Optimized" icon={CheckCircle2} />
                <StudioInsight label="Studio Rating" value={`${Number(kpis.averageRating || 0).toFixed(1)} Signals`} icon={Star} />
              </div>
            </SurfaceCard>

            <div className="space-y-12">
              {/* Studio Vault */}
              <SurfaceCard className="bg-[var(--color-primary-dark)] text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent)]/10 blur-[100px] rounded-full -mr-32 -mt-32 transition-all duration-700 group-hover:bg-[var(--color-accent)]/20" />
                
                <div className="relative z-10 space-y-12">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-[var(--color-accent)] border border-white/10">
                      <BadgeIndianRupee size={28} />
                    </div>
                    <Link to="/seller/earnings" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">Vault Details</Link>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 italic">Settlement Ready</p>
                    <p className="text-6xl font-['Fraunces'] font-bold text-[var(--color-accent)] tracking-tighter">
                      {formatCurrency(earningsSummary.availableEarnings ?? earnings.availableAmount ?? 0)}
                    </p>
                  </div>

                  <div className="pt-10 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mb-1">In Orchestration</p>
                      <p className="text-2xl font-bold text-white/80">{formatCurrency(earningsSummary.pendingEarnings ?? earnings.pendingAmount ?? 0)}</p>
                    </div>
                    <Link 
                      to="/seller/earnings" 
                      className="w-16 h-16 bg-[var(--color-accent)] text-[var(--color-primary-dark)] rounded-[1.8rem] flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95"
                    >
                      <ArrowUpRight size={28} />
                    </Link>
                  </div>
                </div>
              </SurfaceCard>

              {/* Orchestration Hub */}
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 rounded-[4rem] shadow-xl">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-10 italic">Orchestration Hub</h3>
                <div className="grid gap-6">
                  <OrchestrationAction 
                    to="/seller/products/new" 
                    label="Curate Piece" 
                    icon={<Plus size={24} />} 
                    variant="accent"
                  />
                  <OrchestrationAction 
                    to="/seller/orders" 
                    label="Registry Hub" 
                    icon={<ClipboardList size={24} />} 
                    variant="ghost"
                  />
                  <OrchestrationAction 
                    to="/seller/inventory" 
                    label="Studio Assets" 
                    icon={<Layers size={24} />} 
                    variant="ghost"
                  />
                </div>
              </SurfaceCard>

              {/* Logistics Schedule */}
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 rounded-[4rem] shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--color-primary-dark)]">Logistics Schedule</h3>
                    <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1">Monthly Delivery Pulse</p>
                  </div>
                  <Calendar size={24} className="text-[var(--color-accent)] opacity-30" />
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                  {calendarDays.length === 0 ? (
                    <p className="text-sm italic text-[var(--color-text-muted)] text-center py-10">No scheduled arrivals for this cycle.</p>
                  ) : (
                    calendarDays.map((day, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-[var(--color-sand)]/10 border border-transparent flex items-center justify-between group hover:bg-white hover:border-[var(--color-accent)]/20 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-dark)] text-white flex flex-col items-center justify-center">
                            <span className="text-[8px] font-black uppercase leading-none">{new Date(day.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                            <span className="text-sm font-bold leading-none">{new Date(day.date).getDate()}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--color-primary-dark)]">{day.orderCount} Acquisition{day.orderCount > 1 ? 's' : ''}</p>
                            <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Expected Arrival</p>
                          </div>
                        </div>
                        <ArrowRightCircle size={16} className="text-[var(--color-stone)]/20 group-hover:text-[var(--color-accent)] transition-all" />
                      </div>
                    ))
                  )}
                </div>
              </SurfaceCard>
            </div>
          </div>

          {/* Acquisition Ledger Previews */}
          <div className="grid gap-16 lg:grid-cols-2">
            <SurfaceCard className="bg-white/60 backdrop-blur-3xl border-white p-12 shadow-2xl rounded-[4rem]">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Recent Acquisition</h2>
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2">The latest signals from your collectors</p>
                </div>
                <Link to="/seller/orders" className="w-12 h-12 rounded-2xl bg-[var(--color-sand)]/50 flex items-center justify-center text-[var(--color-stone)] hover:text-[var(--color-accent)] transition-all">
                  <History size={24} />
                </Link>
              </div>

              <div className="space-y-6">
                {recentOrders.length === 0 ? (
                  <EmptyBlock icon={ShoppingBag} title="Await Acquisition..." description="Your fulfillment ledger is awaiting its first artisan signal." />
                ) : (
                  recentOrders.map((order, idx) => (
                    <Link 
                      key={order.orderId} 
                      to={`/seller/orders/${order.orderId}`}
                      className="flex items-center justify-between p-8 rounded-[2.5rem] bg-white border border-[var(--color-stone)]/5 hover:border-[var(--color-accent)]/20 shadow-sm hover:shadow-2xl transition-all group"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-[var(--color-sand)]/20 rounded-2xl flex items-center justify-center text-[var(--color-primary-dark)] group-hover:bg-[var(--color-accent)] transition-colors">
                          <Package size={28} />
                        </div>
                        <div>
                          <p className="font-bold text-lg text-[var(--color-primary-dark)]">#{String(order.orderId).slice(-8)}</p>
                          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1 italic">{order.customerName}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-8">
                        <div>
                          <p className="font-bold text-xl text-[var(--color-primary-dark)]">{formatCurrency(order.totalAmount)}</p>
                          <div className="mt-2"><StatusPill value={order.status} /></div>
                        </div>
                        <ChevronRight size={24} className="text-[var(--color-stone)]/20 group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard className="bg-white/60 backdrop-blur-3xl border-white p-12 shadow-2xl rounded-[4rem]">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Premier Exhibits</h2>
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2">Ranked by resonance and acquisition volume</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-sand)]/50 flex items-center justify-center text-[var(--color-stone)]">
                  <Award size={24} />
                </div>
              </div>

              <div className="space-y-6">
                {topProducts.length === 0 ? (
                  <EmptyBlock icon={Star} title="Ranking Pending..." description="Exhibits will be ranked as they gain collector resonance." />
                ) : (
                  topProducts.map((product, i) => (
                    <div key={product.productId} className="flex items-center justify-between p-8 rounded-[2.5rem] bg-white border border-[var(--color-stone)]/5 transition-all hover:shadow-2xl group">
                      <div className="flex items-center gap-6">
                        <span className="text-4xl font-['Fraunces'] font-black text-[var(--color-stone)]/10 group-hover:text-[var(--color-accent)]/20 transition-colors">{(i + 1).toString().padStart(2, '0')}</span>
                        <div>
                          <p className="font-bold text-lg text-[var(--color-primary-dark)]">{product.name}</p>
                          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1 italic">{product.categoryName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-[var(--color-primary-dark)]">{formatCurrency(product.totalRevenue)}</p>
                        <p className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest mt-1 font-black">{product.totalQuantity} Acquisitions</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SurfaceCard>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function OrbCard({ label, value, hint, icon: Icon, accent }) {
  const themes = {
    sand: 'bg-[var(--color-sand)]/50 text-[var(--color-primary-dark)] border-[var(--color-stone)]/5',
    forest: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    accent: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/10',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <SurfaceCard className="bg-white border-[var(--color-stone)]/5 shadow-xl transition-all hover:-translate-y-2 p-10 rounded-[3.5rem] group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--color-sand)]/20 to-transparent rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
      <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110 relative z-10 ${themes[accent]}`}>
        <Icon size={28} />
      </div>
      <p className="mt-10 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] italic relative z-10">{label}</p>
      <p className="mt-3 text-5xl font-['Fraunces'] font-bold text-[var(--color-primary-dark)] tracking-tighter relative z-10">{value}</p>
      <div className="mt-6 flex items-center gap-2 px-3 py-1 bg-[var(--color-sand)]/30 rounded-full w-fit relative z-10">
        <div className="w-1 h-1 rounded-full bg-[var(--color-accent)] animate-pulse" />
        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{hint}</span>
      </div>
    </SurfaceCard>
  );
}

function StudioInsight({ label, value, icon: Icon }) {
  return (
    <div className="group cursor-default">
      <div className="flex items-center gap-2 mb-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors">
        <Icon size={16} />
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] italic">{label}</span>
      </div>
      <p className="text-3xl font-bold text-[var(--color-primary-dark)] tracking-tighter leading-tight">{value}</p>
    </div>
  );
}

function OrchestrationAction({ to, label, icon, variant }) {
  const styles = {
    accent: 'bg-[var(--color-accent)] text-[var(--color-primary-dark)] shadow-[var(--color-accent)]/20 border-transparent',
    ghost: 'bg-[var(--color-sand)]/20 text-[var(--color-primary-dark)] border-[var(--color-stone)]/5 hover:bg-white hover:shadow-2xl',
  };

  return (
    <Link 
      to={to} 
      className={`flex items-center justify-between p-8 rounded-[2.5rem] transition-all hover:scale-[1.02] active:scale-95 border-2 group ${styles[variant]}`}
    >
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-white/30 rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
          {icon}
        </div>
        <span className="text-xl font-bold tracking-tight">{label}</span>
      </div>
      <ChevronRight size={24} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

function EmptyBlock({ icon: Icon, title, description }) {
  return (
    <div className="py-20 text-center bg-[var(--color-sand)]/5 border-2 border-dashed border-[var(--color-stone)]/10 rounded-[3.5rem]">
      <div className="w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center mx-auto text-[var(--color-stone)]/20 mb-8 border border-[var(--color-stone)]/5 shadow-xl">
        <Icon size={40} />
      </div>
      <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)] mt-3 italic max-w-xs mx-auto leading-relaxed">{description}</p>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="space-y-16 animate-pulse px-6">
      <div className="h-72 rounded-[4rem] bg-[var(--color-sand)]/20" />
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 rounded-[3.5rem] bg-[var(--color-sand)]/20" />
        ))}
      </div>
      <div className="grid gap-16 xl:grid-cols-[1.5fr,0.5fr]">
        <div className="h-[600px] rounded-[4rem] bg-[var(--color-sand)]/20" />
        <div className="h-[600px] rounded-[4rem] bg-[var(--color-sand)]/20" />
      </div>
    </div>
  );
}


