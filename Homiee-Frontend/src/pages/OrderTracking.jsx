import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronRight, 
  Circle, 
  CircleCheckBig, 
  PackageSearch, 
  PenSquare, 
  XCircle,
  ArrowLeft,
  Clock,
  Truck,
  Package,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  CreditCard,
  MessageSquare,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cancelOrder, getMyOrders, getOrderById, getOrderStatusHistory } from '../api/customer';
import SafeImage from '../components/SafeImage';
import StatePanel from '../components/StatePanel';
import SurfaceCard from '../components/SurfaceCard';
import StatusPill from '../components/StatusPill';
import { useToast } from '../hooks/useToast';
import { getResponseData } from '../utils/api';

const TIMELINE_STEPS = ['Placed', 'Accepted', 'Processing', 'Shipped', 'Delivered'];

export default function OrderTracking() {
  const { orderId } = useParams();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: orderResponse, isLoading: orderLoading, error: orderError, refetch: refetchOrder } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: Boolean(orderId),
  });

  const { data: historyResponse, error: historyError, refetch: refetchHistory } = useQuery({
    queryKey: ['order-history', orderId],
    queryFn: () => getOrderStatusHistory(orderId),
    enabled: Boolean(orderId),
  });

  const { data: ordersResponse } = useQuery({
    queryKey: ['orders'],
    queryFn: getMyOrders,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-history', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled successfully.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel order.');
    },
  });

  const order = getResponseData(orderResponse);
  const history = getResponseData(historyResponse) ?? [];
  const ordersList = getResponseData(ordersResponse) ?? [];
  const orderSummary = ordersList.find((entry) => String(entry.id) === String(orderId));
  const displayStatus = getDisplayStatus(order?.status);
  const statusTrail = history.length > 0 ? history : order ? [{ status: order.status, createdAt: order.createdAt }] : [];
  const currentStepIndex = TIMELINE_STEPS.indexOf(displayStatus);
  const canCancel = ['Pending', 'Processing'].includes(displayStatus);
  const canReview = displayStatus === 'Delivered';

  const timelineEntries = useMemo(() => {
    if (displayStatus === 'Cancelled') {
      return [...TIMELINE_STEPS, 'Cancelled'];
    }
    return TIMELINE_STEPS;
  }, [displayStatus]);

  if (orderLoading) {
    return <TrackingLoadingState />;
  }

  if (orderError || !order) {
    return (
      <div className="min-h-screen bg-[var(--color-sand)]/10 px-6 pb-24 pt-32">
        <div className="mx-auto max-w-4xl">
          <StatePanel
            className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[2rem] sm:rounded-[3rem]"
            message={(
              <div className="text-center">
                <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Failed to load order details.</p>
                <button onClick={() => refetchOrder()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry</button>
              </div>
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-sand)]/10 pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Journey Header */}
        <header className="mb-16">
          <Link 
            to="/orders" 
            className="inline-flex items-center gap-3 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] hover:text-[var(--color-accent)] transition-colors group mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center group-hover:bg-[var(--color-sand)]/20 transition-all">
              <ArrowLeft size={18} />
            </div>
            Back to My Orders
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tight">Track Order</h1>
              <p className="mt-4 text-xl text-[var(--color-text-muted)] font-medium italic leading-relaxed">
                "Follow your order's progress from the seller to your doorstep."
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-6 px-10 rounded-[2.5rem] border border-white shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                <Package size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1">Order ID</div>
                <div className="text-2xl font-bold text-[var(--color-primary-dark)]">#{String(order.id).slice(-10)}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr]">
          {/* Timeline Canvas */}
          <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-8 sm:p-12 shadow-xl rounded-[2rem] sm:rounded-[4rem]">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1.2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--color-primary-dark)]">Order Status</h2>
                  <div className="mt-1 flex items-center gap-2"><StatusPill value={displayStatus} /></div>
                </div>
              </div>
              <PackageSearch className="text-[var(--color-accent)] opacity-20" size={48} />
            </div>

            <div className="relative space-y-10 pl-4">
              {timelineEntries.map((step, index) => {
                const isCancelledStep = step === 'Cancelled';
                const isComplete = isCancelledStep ? displayStatus === 'Cancelled' : currentStepIndex > index;
                const isCurrent = isCancelledStep ? displayStatus === 'Cancelled' : currentStepIndex === index;
                const isUpcoming = !isComplete && !isCurrent;
                const historyEntry = statusTrail.find((entry) => getDisplayStatus(entry.status) === step);

                return (
                  <motion.div 
                    key={step} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-8 relative"
                  >
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center">
                      {isComplete ? (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isCancelledStep ? 'bg-rose-500 text-white' : 'bg-[var(--color-primary-dark)] text-[var(--color-accent)]'}`}>
                          <CheckCircle2 size={24} />
                        </div>
                      ) : isCurrent ? (
                        <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center shadow-lg ${isCancelledStep ? 'border-rose-400 bg-rose-50' : 'border-[var(--color-accent)] bg-white'}`}>
                          <div className={`h-3 w-3 rounded-full ${isCancelledStep ? 'bg-rose-500' : 'bg-[var(--color-accent)]'} animate-pulse`} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-stone)]/10 bg-white" />
                      )}
                      {index < timelineEntries.length - 1 ? (
                        <div className={`absolute top-10 h-10 w-0.5 ${isComplete ? 'bg-[var(--color-primary-dark)]' : 'bg-[var(--color-stone)]/10'}`} />
                      ) : null}
                    </div>
                    
                    <div className="pt-1">
                      <div className={`text-xl font-bold ${isUpcoming ? 'text-[var(--color-stone)]/30' : 'text-[var(--color-primary-dark)]'}`}>{step}</div>
                      <div className="mt-2 flex items-center gap-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                        {historyEntry?.createdAt ? (
                           <><Clock size={12} /> {formatDateTime(historyEntry.createdAt)}</>
                        ) : isCurrent ? (
                          'Active Status'
                        ) : (
                          'Awaiting Processing'
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {historyError && (
              <div className="mt-12 p-6 rounded-[2rem] bg-amber-50 border border-amber-100 text-amber-800 text-xs italic leading-relaxed flex gap-3">
                <Sparkles size={16} className="shrink-0 text-amber-600" />
                "Order history details are being updated, but the current status is verified."
              </div>
            )}
          </SurfaceCard>

          {/* Exhibition Canvas */}
          <div className="space-y-10">
             <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-xl">
              <h2 className="text-2xl font-bold text-[var(--color-primary-dark)] mb-8 flex items-center gap-3">
                <HistoryIcon size={20} className="text-[var(--color-accent)]" />
                Order Info
              </h2>
               <div className="space-y-6">
                <SummaryRow label="Order Number" value={`#${order.id}`} />
                <SummaryRow label="Order Date" value={formatDate(order.createdAt)} />
                {order.requestedDeliveryDate && (
                  <SummaryRow label="Expected Delivery" value={formatDate(order.requestedDeliveryDate)} />
                )}
                <SummaryRow label="Order Total" value={formatCurrency(order.totalAmount ?? 0)} />
                <SummaryRow label="Payment Method" value={orderSummary?.paymentMethod || 'Paid'} />
                <SummaryRow label="Payment Status" value={displayStatus === 'Delivered' ? 'Completed' : displayStatus === 'Cancelled' ? 'Voided' : 'Pending'} />
              </div>

              <div className="mt-10 p-6 rounded-[2rem] bg-[var(--color-sand)]/10 border border-transparent flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[var(--color-primary-dark)] shrink-0 shadow-sm">
                  <MapPin size={20} />
                </div>
                 <div className="min-w-0">
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Delivery Address</p>
                  <p className="text-sm font-medium text-[var(--color-stone)] italic leading-relaxed">
                    "Your delivery address is protected and will be visible to the courier during shipping."
                  </p>
                </div>
              </div>
            </SurfaceCard>

             <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-xl">
              <h2 className="text-xl font-bold text-[var(--color-primary-dark)] mb-8">Order Items</h2>
              <div className="space-y-6">
                {(order.items ?? []).map((item) => (
                  <div key={item.productId} className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-[2.5rem] bg-[var(--color-sand)]/10 border border-transparent hover:border-[var(--color-accent)]/10 transition-all group">
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                      <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden bg-white shadow-sm shrink-0">
                        <SafeImage src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="min-w-0">
                        <Link to={`/product/${item.productId}`} className="text-lg font-bold text-[var(--color-primary-dark)] hover:text-[var(--color-accent)] transition-colors truncate block">
                          {item.productName}
                        </Link>
                         <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1">
                          Quantity: {item.quantity} • {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>

                    {canReview && (
                       <Link
                        to={`/product/${item.productId}`}
                        className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-[var(--color-stone)]/10 text-[var(--color-primary-dark)] font-bold text-sm shadow-sm hover:bg-[var(--color-primary-dark)] hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <PenSquare size={16} />
                        Write a Review
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard className="bg-[var(--color-primary-dark)] text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 blur-3xl rounded-full -mr-20 -mt-20" />
               <div className="relative z-10">
                <h2 className="text-2xl font-['Fraunces'] font-semibold mb-4">Order Actions</h2>
                <p className="text-white/40 font-medium text-sm leading-relaxed italic mb-8">
                  "You can cancel your order while it's still being processed."
                </p>
                   <button
                  disabled={!canCancel || cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate(order.id)}
                  className="w-full py-5 rounded-[2rem] bg-rose-500/10 border-2 border-rose-500/20 text-rose-500 font-bold hover:bg-rose-500 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <XCircle size={18} />
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </SurfaceCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[var(--color-stone)]/5 last:border-0">
      <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{label}</span>
      <span className="text-sm font-bold text-[var(--color-primary-dark)]">{value}</span>
    </div>
  );
}

function HistoryIcon({ size, className }) {
  return <Layers size={size} className={className} />;
}

function TrackingLoadingState() {
  return (
    <div className="min-h-screen bg-[var(--color-sand)]/10 pb-24 pt-32">
      <div className="mx-auto max-w-7xl px-6 space-y-12">
        <div className="h-48 rounded-[4rem] bg-[var(--color-sand)]/20 animate-pulse" />
        <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="h-[600px] rounded-[4rem] bg-[var(--color-sand)]/20 animate-pulse" />
          <div className="space-y-8">
            <div className="h-64 rounded-[3.5rem] bg-[var(--color-sand)]/20 animate-pulse" />
            <div className="h-[400px] rounded-[3.5rem] bg-[var(--color-sand)]/20 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function getOrderStage(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pending') return 'Placed';
  if (normalized === 'placed') return 'Placed';
  if (normalized === 'accepted') return 'Accepted';
  if (normalized === 'processing') return 'Processing';
  if (normalized === 'shipped') return 'Shipped';
  if (normalized === 'delivered') return 'Delivered';
  if (normalized === 'cancelled') return 'Cancelled';
  if (normalized === 'rejected') return 'Cancelled';
  return 'Placed';
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

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
