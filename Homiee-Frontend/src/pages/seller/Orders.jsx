import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeIndianRupee,
  ClipboardList,
  Package,
  ShoppingBag,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowUpRight,
  MoreVertical,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatePanel from '../../components/StatePanel';
import StatusPill from '../../components/StatusPill';
import SurfaceCard from '../../components/SurfaceCard';
import { getSellerOrders, updateSellerOrderStatus } from '../../api/seller';
import { useToast } from '../../hooks/useToast';
import { getPagedItems, getPagedMeta } from '../../utils/api';
import { formatCurrency, formatDateTime } from '../../utils/format';

const STATUS_TABS = ['All', 'Pending', 'Placed', 'Accepted', 'Processing', 'Shipped', 'Delivered', 'Rejected', 'Cancelled'];

export default function SellerOrders() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['seller-orders', { page, pageSize: 8, statusFilter }],
    queryFn: () =>
      getSellerOrders({
        page,
        pageSize: 8,
        status: statusFilter === 'All' ? undefined : statusFilter,
      }),
  });

  const orders = getPagedItems(data);
  const meta = getPagedMeta(data);
  const totalPages = Math.max(
    1,
    data?.data?.totalPages || Math.ceil((meta.totalCount || 0) / (meta.pageSize || 8)) || 1
  );

  const mutation = useMutation({
    mutationFn: ({ id, nextStatus }) => updateSellerOrderStatus(id, nextStatus),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-order'] });
      toast.success(response?.message || 'Order status updated.');
    },
    onError: (errorResponse) => {
      toast.error(errorResponse.response?.data?.message || 'Failed to update status.');
    },
  });

  return (
    <div className="space-y-12 pb-20">
      {/* Orders Header */}
      <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[4rem] bg-[var(--color-primary-dark)] p-8 sm:p-12 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
              <ClipboardList size={32} className="text-[var(--color-accent)]" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-['Fraunces'] font-semibold leading-tight">Orders</h1>
              <p className="mt-2 text-white/60 font-medium tracking-wide uppercase text-sm">Manage and fulfill your customer orders.</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center lg:items-end bg-white/5 backdrop-blur-md p-6 px-10 rounded-[2.5rem] border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Total Orders</div>
            <div className="text-4xl font-['Fraunces'] font-bold text-[var(--color-accent)]">{meta.totalCount || 0} Orders</div>
          </div>
        </div>
      </section>

      {/* Status Canvas */}
      <div className="overflow-x-auto pb-4 scrollbar-hide">
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
                    ? 'bg-[var(--color-primary-dark)] border-transparent text-white shadow-xl shadow-[var(--color-primary-dark)]/10' 
                    : 'bg-white border-[var(--color-stone)]/5 text-[var(--color-stone)] hover:bg-[var(--color-sand)]/20'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Registry */}
      {isLoading ? (
        <OrdersLoading />
      ) : error ? (
        <StatePanel
          className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
          message={(
            <div className="text-center">
              <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Failed to load orders.</p>
              <button onClick={() => refetch()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry</button>
            </div>
          )}
        />
      ) : orders.length === 0 ? (
        <div className="py-24 text-center bg-[var(--color-sand)]/10 border-2 border-dashed border-[var(--color-stone)]/10 rounded-[2rem] sm:rounded-[4rem]">
          <ShoppingBag size={64} className="mx-auto text-[var(--color-stone)]/20 mb-6" />
          <p className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">No Orders Found</p>
          <p className="mt-2 text-[var(--color-text-muted)] italic">"No orders found for this status."</p>
        </div>
      ) : (
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <OrderLedgerItem 
                  order={order} 
                  mutation={mutation} 
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 pt-12">
            <button
              disabled={page === 1}
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
                    page === i + 1 
                      ? 'bg-[var(--color-primary-dark)] text-white shadow-lg' 
                      : 'bg-white border border-[var(--color-stone)]/10 text-[var(--color-stone)]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="w-14 h-14 rounded-2xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 transition-all hover:bg-[var(--color-sand)]/20 shadow-sm"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderLedgerItem({ order, mutation }) {
  const nextActions = getNextSellerActions(order.status);
  const isMutating = Number(mutation.variables?.id) === Number(order.id) && mutation.isPending;

  return (
    <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-0 overflow-hidden shadow-xl rounded-[2.5rem] sm:rounded-[3.5rem] group transition-all hover:shadow-2xl hover:border-[var(--color-accent)]/10">
      <div className="flex flex-col xl:flex-row">
        {/* Order Dossier */}
        <div className="flex-1 p-10 xl:p-12">
          <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                <Layers size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">#{String(order.id).slice(-8)}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <StatusPill value={order.status} />
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-[var(--color-primary-dark)]">{formatCurrency(order.totalAmount)}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(order.items ?? []).map((item, i) => (
              <div key={`${order.id}-${i}`} className="flex items-center gap-5 p-4 sm:p-5 rounded-[2rem] bg-[var(--color-sand)]/10 border border-transparent hover:border-[var(--color-accent)]/10 transition-all">
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-[var(--color-primary-dark)] shadow-sm">
                  <Package size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[var(--color-primary-dark)] truncate">{item.productName}</p>
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1">
                    Units: {item.quantity} • {formatCurrency(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fulfillment Control */}
        <div className="w-full xl:w-[400px] bg-[var(--color-sand)]/10 p-10 xl:p-12 border-l border-[var(--color-stone)]/5 flex flex-col justify-between">
          <div className="space-y-8">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-4">Collector Insight</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary-dark)] text-white flex items-center justify-center font-bold">
                  {order.customerName?.[0] || 'C'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[var(--color-primary-dark)] truncate">{order.customerName || 'Customer'}</p>
                  <Link 
                    to={`/chat/${order.customerId}`} 
                    className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest flex items-center gap-2 hover:underline mt-1"
                  >
                    <MessageSquare size={12} /> Send Message
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-4">Update Status</h3>
              <div className="grid gap-3">
                {nextActions.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white border border-[var(--color-stone)]/10 text-center">
                    <CheckCircle2 size={24} className="mx-auto text-[var(--color-primary)] mb-2" />
                    <p className="text-xs font-bold text-[var(--color-text-muted)]">Order Completed</p>
                  </div>
                ) : (
                  nextActions.map((action) => (
                    <button
                      key={action.value}
                      onClick={() => mutation.mutate({ id: order.id, nextStatus: action.value })}
                      disabled={isMutating}
                      className={`w-full py-5 rounded-2xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-3 ${action.className} disabled:opacity-50`}
                    >
                      {isMutating ? <Clock size={16} className="animate-spin" /> : action.icon}
                      {action.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <Link 
            to={`/seller/orders/${order.id}`}
            className="mt-10 flex items-center justify-center gap-2 text-[10px] font-bold text-[var(--color-primary-dark)] uppercase tracking-widest hover:text-[var(--color-accent)] transition-colors py-4 border-t border-[var(--color-stone)]/10"
          >
            View Full Details <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </SurfaceCard>
  );
}

function OrdersLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-64 rounded-[3.5rem] bg-[var(--color-sand)]/20" />
      ))}
    </div>
  );
}

function getNextSellerActions(status) {
  const normalized = String(status || '').toLowerCase();

  // Robust checks for both string labels and numeric Enum values
  const isPending = normalized === 'pending' || normalized === '0';
  const isProcessing = normalized === 'processing' || normalized === '1';
  const isPlaced = normalized === 'placed' || normalized === '2';
  const isShipped = normalized === 'shipped' || normalized === '3';
  const isAccepted = normalized === 'accepted' || normalized === '6';

  if (isPending) {
    return [
      { value: 'Placed', label: 'Mark as Placed', icon: <CheckCircle2 size={18} />, className: 'bg-[var(--color-primary-dark)] text-white hover:bg-[var(--color-primary)]' },
      { value: 'Accepted', label: 'Accept Order', icon: <CheckCircle2 size={18} />, className: 'bg-[var(--color-primary-dark)] text-white hover:bg-[var(--color-primary)]' },
      { value: 'Rejected', label: 'Reject Order', icon: <XCircle size={18} />, className: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
    ];
  }

  if (isPlaced) {
    return [
      { value: 'Accepted', label: 'Accept Order', icon: <CheckCircle2 size={18} />, className: 'bg-[var(--color-primary-dark)] text-white hover:bg-[var(--color-primary)]' },
      { value: 'Processing', label: 'Mark as Processing', icon: <Clock size={18} />, className: 'bg-[var(--color-sand)]/20 text-[var(--color-primary-dark)]' },
      { value: 'Rejected', label: 'Reject Order', icon: <XCircle size={18} />, className: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
    ];
  }

  if (isAccepted) {
    return [
      { value: 'Processing', label: 'Start Processing', icon: <Clock size={18} />, className: 'bg-[var(--color-primary-dark)] text-white shadow-lg' },
      { value: 'Shipped', label: 'Ship Order', icon: <Truck size={18} />, className: 'bg-[var(--color-sand)]/20 text-[var(--color-primary-dark)]' },
    ];
  }

  if (isProcessing) {
    return [
      { value: 'Shipped', label: 'Ship Order', icon: <Truck size={18} />, className: 'bg-[var(--color-primary-dark)] text-white shadow-lg' },
    ];
  }

  if (isShipped) {
    return [
      { value: 'Delivered', label: 'Mark as Delivered', icon: <CheckCircle2 size={18} />, className: 'bg-[var(--color-primary-dark)] text-white' },
    ];
  }

  return [];
}


