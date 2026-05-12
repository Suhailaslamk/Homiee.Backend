import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeIndianRupee,
  CalendarRange,
  ClipboardList,
  CreditCard,
  HandCoins,
  Package,
  ShoppingBag,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  History,
  ChevronRight,
  ChevronLeft,
  ChartColumn,
  Activity,
  Zap,
  Sparkles,
  ArrowRightCircle,
  Clock,
  CheckCircle2,
  Lock
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
import { getSellerAnalytics, getSellerEarnings } from '../../api/seller';
import { getResponseData } from '../../utils/api';

const PAGE_SIZE = 8;

export default function SellerEarnings() {
  const [page, setPage] = useState(1);
  const [range, setRange] = useState('monthly');

  const days = range === 'weekly' ? 7 : 30;

  const {
    data: earningsResponse,
    isLoading: earningsLoading,
    error: earningsError,
    refetch: refetchEarnings,
  } = useQuery({
    queryKey: ['seller-earnings', { page, pageSize: PAGE_SIZE }],
    queryFn: () => getSellerEarnings({ page, pageSize: PAGE_SIZE }),
  });

  const {
    data: analyticsResponse,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ['seller-earnings-analytics', { days }],
    queryFn: () => getSellerAnalytics({ days, topN: 5 }),
  });

  const earnings = getResponseData(earningsResponse) ?? {};
  const analytics = getResponseData(analyticsResponse) ?? {};
  const revenueSeries = analytics.revenueLast30Days ?? [];
  const visibleRevenueSeries = useMemo(
    () => (range === 'weekly' ? revenueSeries.slice(-7) : revenueSeries),
    [range, revenueSeries]
  );

  const earningsItems = earnings.earnings ?? [];
  const totalPages = Math.max(
    1,
    Math.ceil(Number(earnings.totalCount || 0) / Number(earnings.pageSize || PAGE_SIZE)) || 1
  );
  const pageLoading = earningsLoading || analyticsLoading;
  const pageError = earningsError || analyticsError;

  const summaryCards = [
    {
      label: 'Studio Revenue',
      value: formatCurrency(earnings.totalEarned),
      hint: 'Life-time gross acquisitions',
      icon: Wallet,
      accent: 'terracotta',
    },
    {
      label: 'Awaiting Settlement',
      value: formatCurrency(earnings.pendingAmount),
      hint: 'Verifying with platform',
      icon: Clock,
      accent: 'amber',
    },
    {
      label: 'Settled Credit',
      value: formatCurrency(earnings.availableAmount),
      hint: 'Ready for withdrawal',
      icon: HandCoins,
      accent: 'forest',
    },
    {
      label: 'Liquidated Funds',
      value: formatCurrency(earnings.paidOutAmount),
      hint: 'Transferred to account',
      icon: CreditCard,
      accent: 'rose',
    },
  ];

  return (
    <div className="space-y-12 pb-20">
      {pageLoading ? (
        <EarningsLoading />
      ) : pageError ? (
        <StatePanel
          className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
          message={(
            <div className="text-center">
              <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Unable to sync financial treasury.</p>
              <button onClick={() => refetchEarnings()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry Synchronization</button>
            </div>
          )}
        />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Treasury Hero */}
          <section className="relative overflow-hidden rounded-[4rem] bg-[var(--color-primary-dark)] p-12 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 rounded-[2.5rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                  <BadgeIndianRupee size={40} className="text-[var(--color-accent)]" />
                </div>
                <div>
                  <h1 className="text-5xl font-['Fraunces'] font-semibold leading-tight">Studio Treasury</h1>
                  <p className="mt-2 text-white/60 font-medium tracking-wide uppercase text-sm">Managing your artisanal financial legacy</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center lg:items-end bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/10">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Available Balance</div>
                <div className="text-5xl font-['Fraunces'] font-bold text-[var(--color-accent)]">{formatCurrency(earnings.availableAmount ?? 0)}</div>
                <button className="mt-4 px-6 py-2 bg-[var(--color-accent)] text-white rounded-full text-xs font-bold shadow-lg shadow-[var(--color-accent)]/20 hover:scale-105 transition-transform">Withdraw Funds</button>
              </div>
            </div>
          </section>

          {/* Quick Metrics */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <StatCard {...item} />
              </motion.div>
            ))}
          </div>

          <div className="grid gap-12 xl:grid-cols-[1.5fr,0.5fr]">
            {/* Wealth Canvas */}
            <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 shadow-xl rounded-[4rem]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
                <div>
                  <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Wealth Trajectory</h2>
                  <p className="text-[var(--color-text-muted)] font-medium mt-2">Analyzing revenue momentum across cycles.</p>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 bg-[var(--color-sand)]/20 rounded-2xl border border-[var(--color-stone)]/5">
                  <button
                    onClick={() => setRange('weekly')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${range === 'weekly' ? 'bg-[var(--color-primary-dark)] text-white shadow-lg' : 'text-[var(--color-stone)] hover:bg-white/50'}`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => setRange('monthly')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${range === 'monthly' ? 'bg-[var(--color-primary-dark)] text-white shadow-lg' : 'text-[var(--color-stone)] hover:bg-white/50'}`}
                  >
                    30 Days
                  </button>
                </div>
              </div>

              <div className="h-96 w-full min-w-0" style={{ minHeight: '400px' }}>
                {visibleRevenueSeries.length === 0 ? (
                  <EmptyBlock icon={TrendingUp} title="Chart initializing..." description="Your wealth trajectory will populate as acquisitions occur." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%" aspect={2.5} minWidth={0}>
                    <AreaChart data={visibleRevenueSeries}>
                      <defs>
                        <linearGradient id="colorTreasury" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-stone-light)" opacity={0.5} />
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '24px', 
                          border: 'none', 
                          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          backdropFilter: 'blur(10px)',
                          padding: '20px'
                        }}
                        itemStyle={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}
                        formatter={(value) => [formatCurrency(value), 'Cycle Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="var(--color-accent)" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorTreasury)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </SurfaceCard>

            <div className="space-y-12">
              {/* Security Insight */}
              <SurfaceCard className="bg-[var(--color-primary-dark)] text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-accent)]/10 blur-[80px] rounded-full -mr-24 -mt-24 group-hover:bg-[var(--color-accent)]/20 transition-all duration-700" />
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                    <Lock size={24} className="text-[var(--color-accent)]" />
                    Security Pool
                  </h3>
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Pending Verification</p>
                      <p className="text-3xl font-['Fraunces'] font-bold text-[var(--color-accent)]">{formatCurrency(earnings.pendingAmount ?? 0)}</p>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed italic">
                      "Funds are typically held for 3-5 days after fulfillment to ensure collector satisfaction."
                    </p>
                  </div>
                </div>
              </SurfaceCard>

              {/* Action Suite */}
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-8 rounded-[3rem] shadow-xl">
                <h3 className="text-lg font-bold text-[var(--color-primary-dark)] mb-6 uppercase tracking-widest text-[10px]">Financial Actions</h3>
                <div className="grid gap-4">
                  <Link 
                    to="/seller/orders" 
                    className="flex items-center justify-between p-6 rounded-[2rem] bg-[var(--color-sand)]/20 text-[var(--color-primary-dark)] font-bold transition-all hover:bg-[var(--color-sand)]/40 group"
                  >
                    <div className="flex items-center gap-4">
                      <History size={18} className="group-hover:rotate-[-45deg] transition-transform" />
                      <span>Order Ledger</span>
                    </div>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </SurfaceCard>
            </div>
          </div>

          {/* Audit Trail */}
          <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 shadow-xl rounded-[4rem]">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Audit Trail</h2>
                <p className="text-[var(--color-text-muted)] font-medium mt-2">Comprehensive log of per-order payout credits.</p>
              </div>
              <div className="px-6 py-3 rounded-full bg-[var(--color-sand)]/20 text-[10px] font-bold text-[var(--color-primary-dark)] uppercase tracking-widest">
                {earnings.totalCount || 0} Entries Registry
              </div>
            </div>

            <div className="space-y-6">
              {earningsItems.length === 0 ? (
                <EmptyBlock icon={BadgeIndianRupee} title="Registry empty" description="Transaction history will populate as acquisitions are finalized." />
              ) : (
                earningsItems.map((entry, idx) => (
                  <motion.div
                    key={entry.earningId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-8 rounded-[2.5rem] bg-[var(--color-sand)]/10 border border-transparent hover:border-[var(--color-accent)]/20 hover:bg-white hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-[var(--color-primary-dark)] shadow-sm group-hover:scale-110 transition-transform">
                        <BadgeIndianRupee size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-xl font-bold text-[var(--color-primary-dark)]">Acquisition #{String(entry.orderId).slice(-8)}</p>
                          <StatusPill value={entry.status} />
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                          <span>Credited {formatDate(entry.createdAt)}</span>
                          <span className="w-1 h-1 rounded-full bg-[var(--color-stone)]/30" />
                          <span>Dossier: {String(entry.earningId).slice(-8)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-10 mt-6 lg:mt-0 lg:text-right">
                      <div className="hidden sm:block">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">State Arrival</p>
                        <p className="text-sm font-bold text-[var(--color-primary-dark)]">{entry.paidAt ? `Finalized ${formatDate(entry.paidAt)}` : `Available ${formatDate(entry.availableAt)}`}</p>
                      </div>
                      <div className="min-w-[140px]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Net Credit</p>
                        <p className="text-3xl font-['Fraunces'] font-bold text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent)] transition-colors">{formatCurrency(entry.amount)}</p>
                      </div>
                      <ArrowRightCircle size={20} className="text-[var(--color-stone)]/20 group-hover:text-[var(--color-accent)] transition-colors" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 pt-12">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="w-12 h-12 rounded-2xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 transition-all hover:bg-[var(--color-sand)]/20"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                      page === i + 1 
                        ? 'bg-[var(--color-primary-dark)] text-white shadow-md' 
                        : 'bg-white border border-[var(--color-stone)]/10 text-[var(--color-stone)] hover:bg-[var(--color-sand)]/20'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="w-12 h-12 rounded-2xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 transition-all hover:bg-[var(--color-sand)]/20"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </SurfaceCard>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({ label, value, hint, icon: Icon, accent }) {
  const accents = {
    terracotta: 'bg-[var(--color-sand)]/30 text-[var(--color-primary)] border-[var(--color-stone)]/5',
    forest: 'bg-[var(--color-sand)]/30 text-[var(--color-primary-dark)] border-[var(--color-stone)]/5',
    amber: 'bg-[var(--color-sand)]/30 text-[var(--color-accent)] border-[var(--color-stone)]/5',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <SurfaceCard className="bg-white border-[var(--color-stone)]/5 shadow-xl transition-all hover:-translate-y-1 p-8 rounded-[3rem] group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110 ${accents[accent]}`}>
        <Icon size={24} />
      </div>
      <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-4xl font-['Fraunces'] font-bold text-[var(--color-primary-dark)] tracking-tight">{value}</p>
      <p className="mt-3 text-xs font-medium text-[var(--color-text-muted)] italic">{hint}</p>
    </SurfaceCard>
  );
}

function EmptyBlock({ icon: Icon, title, description }) {
  return (
    <div className="p-16 text-center bg-[var(--color-sand)]/5 border-2 border-dashed border-[var(--color-stone)]/10 rounded-[3rem]">
      <div className="w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center mx-auto text-[var(--color-stone)]/20 mb-6 border border-[var(--color-stone)]/5 shadow-sm">
        <Icon size={32} />
      </div>
      <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">{title}</p>
      <p className="text-sm text-[var(--color-text-muted)] mt-2 italic">{description}</p>
    </div>
  );
}

function EarningsLoading() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="h-64 rounded-[4rem] bg-[var(--color-sand)]/20" />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 rounded-[3rem] bg-[var(--color-sand)]/20" />
        ))}
      </div>
      <div className="grid gap-12 xl:grid-cols-[1.5fr,0.5fr]">
        <div className="h-[500px] rounded-[4rem] bg-[var(--color-sand)]/20" />
        <div className="h-[500px] rounded-[3rem] bg-[var(--color-sand)]/20" />
      </div>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return 'Recently';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(new Date(value));
}
