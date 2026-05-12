import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeIndianRupee,
  ChevronLeft,
  ClipboardList,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShoppingBag,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowUpRight,
  Calendar,
  Box,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatePanel from '../../components/StatePanel';
import StatusPill from '../../components/StatusPill';
import SurfaceCard from '../../components/SurfaceCard';
import { getSellerOrderById, getSellerOrderTracking, updateSellerOrderStatus } from '../../api/seller';
import { useToast } from '../../hooks/useToast';
import { getResponseData } from '../../utils/api';

const TIMELINE_STEPS = ['Pending', 'Placed', 'Accepted', 'Processing', 'Shipped', 'Delivered'];

export default function SellerOrderDetails() {
  const { orderId } = useParams();
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    data: orderResponse,
    isLoading: orderLoading,
    error: orderError,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: ['seller-order', orderId],
    queryFn: () => getSellerOrderById(orderId),
    enabled: Boolean(orderId),
  });

  const {
    data: trackingResponse,
    isLoading: trackingLoading,
    error: trackingError,
    refetch: refetchTracking,
  } = useQuery({
    queryKey: ['seller-order-tracking', orderId],
    queryFn: () => getSellerOrderTracking(orderId),
    enabled: Boolean(orderId),
  });

  const order = getResponseData(orderResponse);
  const tracking = getResponseData(trackingResponse) ?? [];

  const mutation = useMutation({
    mutationFn: (status) => updateSellerOrderStatus(orderId, status),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['seller-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['seller-order-tracking', orderId] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      toast.success(response?.message || 'Fulfillment dossier updated.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to update dossier.');
    },
  });

  const nextActions = useMemo(() => getNextSellerActions(order?.status), [order?.status]);

  return (
    <div className="space-y-12 pb-20">
      {orderLoading ? (
        <OrderDetailsLoading />
      ) : orderError || !order ? (
        <StatePanel
          className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
          message={(
            <div className="text-center">
              <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Unable to sync order dossier.</p>
              <button onClick={() => refetchOrder()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry Synchronization</button>
            </div>
          )}
        />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Back Navigation */}
          <Link 
            to="/seller/orders" 
            className="inline-flex items-center gap-3 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] hover:text-[var(--color-accent)] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center group-hover:bg-[var(--color-sand)]/20 transition-all">
              <ChevronLeft size={18} />
            </div>
            Back to Ledger
          </Link>

          {/* Dossier Hero */}
          <section className="relative overflow-hidden rounded-[4rem] bg-[var(--color-primary-dark)] p-12 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                  <ShoppingBag size={32} className="text-[var(--color-accent)]" />
                </div>
                <div>
                  <div className="flex items-center gap-4">
                    <h1 className="text-5xl font-['Fraunces'] font-semibold leading-tight">Order #{String(order.orderId).slice(-8)}</h1>
                    <StatusPill value={order.status} />
                  </div>
                  <p className="mt-2 text-white/60 font-medium tracking-wide uppercase text-sm flex items-center gap-2">
                    <Calendar size={14} /> Transaction Date: {formatDateTime(order.createdAt)}
                  </p>
                  {order.requestedDeliveryDate && (
                    <p className="mt-2 text-[var(--color-accent)] font-bold tracking-widest uppercase text-[10px] flex items-center gap-2">
                      <Truck size={14} /> Delivery Requested: {new Date(order.requestedDeliveryDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-center lg:items-end bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/10">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Total Acquisition</div>
                <div className="text-5xl font-['Fraunces'] font-bold text-[var(--color-accent)]">{formatCurrency(order.totalAmount)}</div>
                <div className="mt-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">{order.items?.length || 0} Unique Pieces</div>
              </div>
            </div>
          </section>

          <div className="grid gap-12 xl:grid-cols-[1fr,400px]">
            <div className="space-y-12">
              {/* Fulfillment Timeline */}
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 shadow-xl rounded-[4rem]">
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Fulfillment Journey</h2>
                    <p className="text-[var(--color-text-muted)] font-medium mt-2">Historical progression of the acquisition state.</p>
                  </div>
                  <div className="w-16 h-16 rounded-[1.5rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                    <Clock size={32} />
                  </div>
                </div>

                <div className="relative space-y-8 pl-12 before:absolute before:left-[23px] before:top-2 before:bottom-2 before:w-1 before:bg-[var(--color-sand)]/30">
                  {buildTimelineSteps(order.status, tracking).map((step, index) => {
                    const isCompleted = step.state === 'completed';
                    const isCurrent = step.state === 'current';
                    
                    return (
                      <div key={index} className="relative group">
                        <div className={`absolute -left-[45px] top-1 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center transition-all shadow-sm z-10 ${
                          isCompleted ? 'bg-[var(--color-primary)] text-white' : 
                          isCurrent ? 'bg-[var(--color-accent)] text-white scale-125 shadow-xl' : 
                          'bg-[var(--color-sand)]/30 text-[var(--color-stone)]'
                        }`}>
                          {isCompleted ? <CheckCircle2 size={16} /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                        </div>
                        <div className={`p-6 rounded-[2rem] transition-all border ${
                          isCurrent ? 'bg-[var(--color-sand)]/10 border-[var(--color-accent)]/20 shadow-lg' : 
                          'bg-transparent border-transparent'
                        }`}>
                          <h4 className={`text-lg font-bold ${isCurrent ? 'text-[var(--color-primary-dark)]' : 'text-[var(--color-stone)]'}`}>{step.label}</h4>
                          <p className="text-xs font-medium text-[var(--color-text-muted)] mt-1">
                            {step.date ? formatDateTime(step.date) : 'Awaiting stage arrival'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SurfaceCard>

              {/* Acquisition Exhibit */}
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 shadow-xl rounded-[4rem]">
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Order Exhibits</h2>
                  <div className="w-16 h-16 rounded-[1.5rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                    <Box size={32} />
                  </div>
                </div>

                <div className="space-y-6">
                  {(order.items ?? []).map((item, i) => (
                    <div key={i} className="flex flex-col md:flex-row items-center justify-between p-8 rounded-[2.5rem] bg-[var(--color-sand)]/10 border border-transparent hover:border-[var(--color-accent)]/20 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-[var(--color-primary-dark)] shadow-sm group-hover:scale-110 transition-transform">
                          <Package size={32} />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-[var(--color-primary-dark)]">{item.productName}</p>
                          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1">Registry ID: {String(item.productId).slice(-8)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-10 mt-8 md:mt-0 text-right">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Volume</p>
                          <p className="text-lg font-bold text-[var(--color-primary-dark)]">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Unit Value</p>
                          <p className="text-lg font-bold text-[var(--color-primary-dark)]">{formatCurrency(item.price)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Total</p>
                          <p className="text-xl font-bold text-[var(--color-primary-dark)]">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            </div>

            <div className="space-y-12">
              {/* Advance Fulfillment */}
              <SurfaceCard className="bg-[var(--color-primary-dark)] text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-accent)]/10 blur-[80px] rounded-full -mr-24 -mt-24 group-hover:bg-[var(--color-accent)]/20 transition-all duration-700" />
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-[var(--color-accent)]">
                    <Zap size={24} />
                    Advance Stage
                  </h3>
                  <div className="grid gap-3">
                    {nextActions.length === 0 ? (
                      <div className="p-8 text-center rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md">
                        <Sparkles size={32} className="mx-auto text-[var(--color-accent)] mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest text-white/40">Journey Finalized</p>
                      </div>
                    ) : (
                      nextActions.map((action) => (
                        <button
                          key={action.value}
                          onClick={() => mutation.mutate(action.value)}
                          disabled={mutation.isPending}
                          className={`w-full py-6 rounded-2xl font-bold text-sm transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 ${action.className}`}
                        >
                          {mutation.isPending ? <Clock size={18} className="animate-spin" /> : action.icon}
                          {action.label}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </SurfaceCard>

              {/* Registry Insight */}
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 rounded-[3rem] shadow-xl">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-8">Collector Profile</h3>
                <div className="space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-[var(--color-primary-dark)] text-white flex items-center justify-center font-bold text-lg shadow-lg">
                      {order.customerName?.[0] || 'C'}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--color-primary-dark)]">{order.customerName || 'Private Collector'}</p>
                      <p className="text-xs font-medium text-[var(--color-text-muted)]">{order.customerEmail}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6 pt-8 border-t border-[var(--color-stone)]/5">
                    <DetailRow icon={Phone} label="Communication" value={order.shippingPhone} />
                    <DetailRow icon={MapPin} label="Shipping Registry" value={formatAddress(order)} />
                  </div>

                  <div className="pt-8">
                    <button 
                      disabled
                      className="w-full py-5 rounded-2xl bg-[var(--color-sand)]/20 text-[var(--color-stone)]/40 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 border-2 border-dashed border-[var(--color-stone)]/10"
                    >
                      <MessageCircle size={18} /> Chat Synced in Cloud
                    </button>
                    <p className="mt-4 text-[10px] font-bold text-center text-[var(--color-text-muted)] uppercase tracking-widest italic">"Direct transmission available in Studio Hub"</p>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-3 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors">
        <Icon size={14} />
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-bold text-[var(--color-primary-dark)] leading-relaxed">{value || 'Registry Missing'}</p>
    </div>
  );
}

function OrderDetailsLoading() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="h-10 w-48 rounded-full bg-[var(--color-sand)]/20" />
      <div className="h-64 rounded-[4rem] bg-[var(--color-sand)]/20" />
      <div className="grid gap-12 xl:grid-cols-[1fr,400px]">
        <div className="h-[600px] rounded-[4rem] bg-[var(--color-sand)]/20" />
        <div className="h-[600px] rounded-[3rem] bg-[var(--color-sand)]/20" />
      </div>
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
      { value: 'Placed', label: 'Confirm Placement', icon: <CheckCircle2 size={18} />, className: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-primary)] transition-all' },
      { value: 'Accepted', label: 'Accept Acquisition', icon: <CheckCircle2 size={18} />, className: 'bg-[var(--color-primary-dark)] text-white hover:bg-[var(--color-primary)] transition-all shadow-xl' },
    ];
  }

  if (isPlaced) {
    return [
      { value: 'Accepted', label: 'Accept Acquisition', icon: <CheckCircle2 size={18} />, className: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-primary)] transition-all shadow-xl' },
      { value: 'Rejected', label: 'Reject Order', icon: <XCircle size={18} />, className: 'bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all' },
    ];
  }

  if (isAccepted) {
    return [
      { value: 'Processing', label: 'Begin Processing', icon: <Clock size={18} />, className: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-primary)] transition-all shadow-xl shadow-[var(--color-accent)]/20' },
      { value: 'Shipped', label: 'Skip to Dispatch', icon: <Truck size={18} />, className: 'bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all' },
    ];
  }

  if (isProcessing) {
    return [
      { value: 'Shipped', label: 'Dispatch Shipment', icon: <Truck size={18} />, className: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-primary)] transition-all shadow-xl' },
    ];
  }

  if (isShipped) {
    return [
      { value: 'Delivered', label: 'Finalize Delivery', icon: <CheckCircle2 size={18} />, className: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-primary)] transition-all shadow-xl' },
    ];
  }

  return [];
}

function buildTimelineSteps(currentStatus, history) {
  const normalizedHistory = history.map((item) => ({
    ...item,
    normalizedStatus: normalizeStatus(item.status),
  }));
  const currentNormalized = normalizeStatus(currentStatus);
  const currentIndex = TIMELINE_STEPS.findIndex((step) => step === currentNormalized);

  return TIMELINE_STEPS.map((step, index) => {
    const matchingHistory = normalizedHistory.find((item) => item.normalizedStatus === step);

    if (matchingHistory) {
      return {
        label: step,
        state: currentNormalized === step ? 'current' : 'completed',
        date: matchingHistory.createdAt,
      };
    }

    if (currentIndex > index) {
      return { label: step, state: 'completed', date: null };
    }

    if (currentIndex === index) {
      return { label: step, state: 'current', date: null };
    }

    return { label: step, state: 'upcoming', date: null };
  });
}

function normalizeStatus(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pending') return 'Pending';
  if (normalized === 'placed') return 'Placed';
  if (normalized === 'accepted') return 'Accepted';
  if (normalized === 'processing') return 'Processing';
  if (normalized === 'shipped') return 'Shipped';
  if (normalized === 'delivered') return 'Delivered';
  return 'Pending';
}

function formatAddress(order) {
  return [
    order.shippingFullName,
    order.shippingLine1,
    [order.shippingCity, order.shippingState].filter(Boolean).join(', '),
    order.shippingPincode,
  ]
    .filter(Boolean)
    .join(' | ');
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
