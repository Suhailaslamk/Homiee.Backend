import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronRight, 
  PackageSearch, 
  ShoppingBag, 
  Calendar, 
  MessageSquare, 
  ArrowUpRight,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  Sparkles,
  Search,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyOrders } from '../api/customer';
import SafeImage from '../components/SafeImage';
import StatePanel from '../components/StatePanel';
import StatusPill from '../components/StatusPill';
import SurfaceCard from '../components/SurfaceCard';
import { getResponseData } from '../utils/api';

const PAGE_SIZE = 6;
const STATUS_TABS = ['All', 'Pending', 'Placed', 'Accepted', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: getMyOrders,
  });

  const orders = getResponseData(data) ?? [];

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter === 'All') {
        return true;
      }
      return getOrderStage(order.status) === statusFilter;
    });
  }, [orders, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[var(--color-sand)]/10 pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Ledger Hero */}
        <header className="mb-16">
          <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-6">
            <Link to="/profile" className="hover:text-[var(--color-accent)] transition-colors">Patron Dossier</Link>
            <ChevronRight size={12} className="opacity-30" />
            <span className="text-[var(--color-primary-dark)]">Acquisition Ledger</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tight">Your Acquisitions</h1>
              <p className="mt-4 text-xl text-[var(--color-text-muted)] font-medium italic leading-relaxed">
                "A comprehensive registry of your artisanal acquisitions and their fulfillment journey."
              </p>
            </div>
            
            <div className="flex flex-col items-center lg:items-end bg-white/50 backdrop-blur-md p-6 px-10 rounded-[2.5rem] border border-white shadow-xl">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">Total Ledger Volume</div>
              <div className="text-4xl font-['Fraunces'] font-bold text-[var(--color-accent)]">{orders.length} Acquisitions</div>
            </div>
          </div>
        </header>

        {/* Status Ribbon */}
        <div className="mb-10 overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setStatusFilter(tab);
                    setPage(1);
                  }}
                  className={`px-8 py-4 rounded-[1.5rem] font-bold transition-all text-sm border-2 ${
                    isActive 
                      ? 'bg-[var(--color-primary-dark)] border-transparent text-white shadow-xl' 
                      : 'bg-white border-[var(--color-stone)]/5 text-[var(--color-stone)] hover:bg-[var(--color-sand)]/20'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <OrdersLoadingState />
        ) : error ? (
          <StatePanel
            className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
            message={(
              <div className="text-center">
                <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Unable to sync acquisition ledger.</p>
                <button onClick={() => refetch()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry Synchronization</button>
              </div>
            )}
          />
        ) : filteredOrders.length === 0 ? (
          <div className="py-24 text-center bg-[var(--color-sand)]/10 border-2 border-dashed border-[var(--color-stone)]/10 rounded-[4rem]">
            <ShoppingBag size={64} className="mx-auto text-[var(--color-stone)]/20 mb-6" />
            <p className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Registry Quiescent</p>
            <p className="mt-2 text-[var(--color-text-muted)] italic">"No acquisitions found in this status category."</p>
          </div>
        ) : (
          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {paginatedOrders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <OrderLedgerItem order={order} />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-12">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="w-14 h-14 rounded-2xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 transition-all hover:bg-[var(--color-sand)]/20 shadow-sm"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-12 h-12 rounded-2xl font-bold transition-all ${
                        currentPage === i + 1 
                          ? 'bg-[var(--color-primary-dark)] text-white shadow-lg' 
                          : 'bg-white border border-[var(--color-stone)]/10 text-[var(--color-stone)]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="w-14 h-14 rounded-2xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 transition-all hover:bg-[var(--color-sand)]/20 shadow-sm"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderLedgerItem({ order }) {
  return (
    <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-0 overflow-hidden shadow-xl rounded-[3.5rem] group transition-all hover:shadow-2xl hover:border-[var(--color-accent)]/10">
      <div className="flex flex-col xl:flex-row">
        {/* Acquisition Brief */}
        <div className="flex-1 p-10 xl:p-12">
          <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                <Layers size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">#{String(order.id).slice(-8)}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <StatusPill value={getDisplayStatus(order.status)} />
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest flex items-center gap-1">
                    <Calendar size={12} /> {formatDateTime(order.createdAt)}
                  </span>
                  {order.requestedDeliveryDate && (
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                      <Truck size={12} /> Expected: {new Date(order.requestedDeliveryDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Acquisition Total</p>
              <p className="text-3xl font-bold text-[var(--color-primary-dark)]">{formatCurrency(order.totalAmount)}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(order.items ?? []).map((item, i) => (
              <div key={`${order.id}-${i}`} className="flex items-center gap-5 p-5 rounded-[2rem] bg-[var(--color-sand)]/10 border border-transparent hover:border-[var(--color-accent)]/10 transition-all">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shadow-sm shrink-0">
                  <SafeImage src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[var(--color-primary-dark)] truncate">{item.productName}</p>
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1">
                    Volume: {item.quantity} • {formatCurrency(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acquisition Controls */}
        <div className="w-full xl:w-[400px] bg-[var(--color-sand)]/10 p-10 xl:p-12 border-l border-[var(--color-stone)]/5 flex flex-col justify-between">
          <div className="space-y-8">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-4">Origin Hub</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary-dark)] text-white flex items-center justify-center font-bold">
                  {order.shopName?.[0] || 'S'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[var(--color-primary-dark)] truncate">{order.shopName || `Studio #${order.sellerId}`}</p>
                  <p className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest mt-1">Verified Artisan</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-4">Registry Actions</h3>
              <div className="grid gap-3">
                <Link
                  to={`/orders/${order.id}`}
                  className="w-full py-5 rounded-2xl bg-[var(--color-primary-dark)] text-white font-bold text-sm transition-all shadow-xl shadow-[var(--color-primary-dark)]/10 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95"
                >
                  <PackageSearch size={18} className="text-[var(--color-accent)]" />
                  Track Journey
                </Link>
                <Link
                  to={`/chat/${order.sellerId}`}
                  state={{ name: order.shopName || 'Seller' }}
                  className="w-full py-5 rounded-2xl bg-white border border-[var(--color-stone)]/10 text-[var(--color-primary-dark)] font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-3 hover:bg-[var(--color-sand)]/20"
                >
                  <MessageSquare size={18} className="text-[var(--color-accent)]" />
                  Open Transmission
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest py-4 border-t border-[var(--color-stone)]/10">
            <span>Payment: {order.paymentMethod || 'Settled'}</span>
            <div className="flex items-center gap-2 text-[var(--color-accent)]">
              Dossier Validated <CheckCircle2 size={12} />
            </div>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

function OrdersLoadingState() {
  return (
    <div className="space-y-8 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-64 rounded-[3.5rem] bg-[var(--color-sand)]/20" />
      ))}
    </div>
  );
}

function getOrderStage(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pending') return 'Pending';
  if (normalized === 'placed') return 'Placed';
  if (normalized === 'accepted') return 'Accepted';
  if (normalized === 'processing') return 'Processing';
  if (normalized === 'shipped') return 'Shipped';
  if (normalized === 'delivered') return 'Delivered';
  if (normalized === 'cancelled') return 'Cancelled';
  if (normalized === 'rejected') return 'Cancelled';
  return 'Pending';
}

function getDisplayStatus(status) {
  return getOrderStage(status);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
