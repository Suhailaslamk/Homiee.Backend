import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Boxes, 
  ShoppingBag, 
  Users, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  ShieldCheck,
  Receipt,
  User,
  Store,
  Clock,
  Filter,
  ArrowUpRight,
  Hash,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SurfaceCard from '../../components/SurfaceCard';
import StatusPill from '../../components/StatusPill';
import StatePanel from '../../components/StatePanel';
import { getAdminOrders, updateAdminOrderStatus } from '../../api/admin';
import { useToast } from '../../hooks/useToast';
import { getPagedItems, getPagedMeta, getResponseData } from '../../utils/api';

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Processing', value: 'Processing' },
  { label: 'Placed', value: 'Placed' },
  { label: 'Shipped', value: 'Shipped' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Cancelled', value: 'Cancelled' },
  { label: 'Accepted', value: 'Accepted' },
  { label: 'Rejected', value: 'Rejected' }
];

export default function Orders() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-orders', status, search, page],
    queryFn: () => getAdminOrders({ page, pageSize, status: status || undefined, search: search || undefined }),
  });

  const orders = getPagedItems(data);
  const { totalPages } = getPagedMeta(data);

  const mutation = useMutation({
    mutationFn: ({ id, nextStatus }) => updateAdminOrderStatus(id, nextStatus),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(response.message || 'Order status updated.');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update status.'),
  });

  return (
    <div className="space-y-12">
      {/* Editorial Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary-dark)] text-white text-[10px] font-bold uppercase tracking-widest mb-6">
            <Receipt size={14} /> Order Management
          </div>
          <h1 className="text-4xl sm:text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight">
            Order <i className="text-[var(--color-accent)]">List.</i>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-[var(--color-text-muted)] font-medium max-w-2xl">
            Review and manage all marketplace orders.
          </p>
        </div>
      </header>

      {/* Advanced Filter Bar */}
      <div className="bg-white rounded-[2.5rem] p-4 shadow-xl border border-[var(--color-stone)]/5 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
          <input
            type="text"
            placeholder="Search by Order ID or keywords..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-16 pr-6 py-5 rounded-2xl bg-[var(--color-sand)]/20 border-transparent focus:bg-white focus:border-[var(--color-accent)] transition-all outline-none font-medium text-[var(--color-primary-dark)]"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
            <select 
              value={status} 
              onChange={(event) => { setStatus(event.target.value); setPage(1); }} 
              className="w-full pl-12 pr-4 py-5 rounded-2xl bg-[var(--color-sand)]/20 border-transparent outline-none font-bold text-sm text-[var(--color-primary-dark)] appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.label}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Records */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-[2.5rem] bg-[var(--color-sand)]/20" />
            ))}
          </div>
        ) : error ? (
          <StatePanel
            className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[2.5rem]"
            message={(
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--color-primary-dark)] mb-4">Failed to load orders.</p>
                <button onClick={() => refetch()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry</button>
              </div>
            )}
          />
        ) : orders.length === 0 ? (
          <SurfaceCard className="bg-white border-[var(--color-stone)]/10 text-center py-24 rounded-[3rem]">
            <ShoppingBag size={64} className="mx-auto text-[var(--color-sand)] mb-6" />
            <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">No Orders Found</h3>
            <p className="mt-2 text-[var(--color-text-muted)] font-medium">Try adjusting your filters.</p>
          </SurfaceCard>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid gap-6">
              {orders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <SurfaceCard className="bg-white border-[var(--color-stone)]/5 shadow-xl hover:shadow-2xl hover:border-[var(--color-accent)]/20 transition-all rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 group">
                    <div className="flex flex-col xl:flex-row items-center gap-8">
                      {/* Transaction Identity */}
                      <div className="flex items-center gap-6 flex-1 min-w-0 w-full">
                        <div className="w-20 h-20 rounded-[2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)] shrink-0 shadow-inner group-hover:bg-[var(--color-accent)]/10 transition-colors">
                          <Receipt size={32} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">
                              Order <Hash size={18} className="inline opacity-30" />{String(order.id).slice(-8)}
                            </span>
                            <StatusPill value={order.status || 'Pending'} />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[var(--color-text-muted)] font-medium text-sm">
                            <span className="flex items-center gap-2"><User size={14} className="text-[var(--color-primary)]" /> Customer #{String(order.userId).slice(-6)}</span>
                            <span className="flex items-center gap-2"><Store size={14} className="text-[var(--color-accent)]" /> Seller #{String(order.sellerId).slice(-6)}</span>
                            <span className="flex items-center gap-2"><Clock size={14} /> {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {order.requestedDeliveryDate && (
                              <span className="flex items-center gap-2 text-emerald-600 font-bold"><Calendar size={14} /> Expected: {new Date(order.requestedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Transaction Value & Control */}
                      <div className="flex flex-wrap items-center gap-8 w-full xl:w-auto justify-end">
                        <div className="text-right">
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1">Total Amount</div>
                          <div className="text-3xl font-bold text-[var(--color-primary-dark)]">{formatCurrency(order.totalAmount)}</div>
                        </div>

                        <div className="relative group/select">
                          <select
                            value={STATUS_OPTIONS.find(opt => opt.label === order.status)?.value ?? 0}
                            onChange={(event) => mutation.mutate({ id: order.id, nextStatus: event.target.value })}
                            className="appearance-none rounded-2xl bg-[var(--color-sand)]/20 px-8 py-4 pr-12 font-bold text-sm text-[var(--color-primary-dark)] outline-none border-2 border-transparent focus:border-[var(--color-accent)] transition-all cursor-pointer"
                          >
                            {STATUS_OPTIONS.map((item) => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </select>
                          <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-[var(--color-text-muted)] pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </SurfaceCard>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Refined Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 py-12">
          <button 
            disabled={page === 1}
            onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="w-14 h-14 rounded-full bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 hover:bg-[var(--color-sand)]/20 transition-all shadow-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="px-8 py-4 rounded-full bg-white border border-[var(--color-stone)]/10 text-sm font-bold text-[var(--color-primary-dark)] shadow-lg uppercase tracking-widest">
            Page <span className="text-[var(--color-accent)]">{page}</span> of {totalPages}
          </div>
          <button 
            disabled={page === totalPages}
            onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="w-14 h-14 rounded-full bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 hover:bg-[var(--color-sand)]/20 transition-all shadow-lg"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
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
