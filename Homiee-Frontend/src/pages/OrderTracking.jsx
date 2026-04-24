import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Circle, CircleCheckBig, PackageSearch, XCircle } from 'lucide-react';
import { cancelOrder, getOrderById, getOrderStatusHistory } from '../api/customer';
import { useToast } from '../hooks/useToast';
import { getResponseData } from '../utils/api';

export default function OrderTracking() {
  const { orderId } = useParams();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: orderResponse, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: Boolean(orderId),
  });

  const { data: historyResponse } = useQuery({
    queryKey: ['order-history', orderId],
    queryFn: () => getOrderStatusHistory(orderId),
    enabled: Boolean(orderId),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(response.message || 'Order cancelled.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to cancel order.');
    },
  });

  const order = getResponseData(orderResponse);
  const history = getResponseData(historyResponse) ?? [];

  if (isLoading) {
    return <State message="Loading order..." />;
  }

  if (!order) {
    return <State message="Order details could not be loaded." />;
  }

  const statusTrail = history.length > 0 ? history : [{ status: order.status, updatedAt: order.createdAt }];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8">
          <div className="text-sm text-slate-400">
            <Link to="/profile" className="hover:text-slate-700">Profile</Link> <ChevronRight className="inline" size={14} /> Order #{order.id}
          </div>
          <h1 className="mt-3 text-3xl font-black text-slate-900">Order Tracking</h1>
          <p className="mt-2 text-slate-500">Track status changes and review the items included in this order.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Status</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{order.status}</div>
              </div>
              <PackageSearch className="text-blue-600" size={28} />
            </div>

            <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-slate-200">
              {statusTrail.map((entry, index) => {
                const completed = index < statusTrail.length - 1 || entry.status === order.status;
                return (
                  <div key={`${entry.status}-${index}`} className="relative flex gap-4">
                    <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white">
                      {completed ? <CircleCheckBig size={20} className="text-blue-600" /> : <Circle size={16} className="text-slate-300" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{entry.status}</div>
                      <div className="text-sm text-slate-500">{new Date(entry.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">Order Summary</h2>
              <div className="mt-6 space-y-4">
                <SummaryRow label="Order ID" value={`#${order.id}`} />
                <SummaryRow label="Placed on" value={new Date(order.createdAt).toLocaleDateString()} />
                <SummaryRow label="Total" value={`$${Number(order.totalAmount ?? 0).toFixed(2)}`} />
              </div>
              <div className="mt-6 border-t border-slate-100 pt-6">
                <div className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Items</div>
                <div className="space-y-3">
                  {(order.items ?? []).map((item) => (
                    <div key={item.productId} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="mt-1 text-sm text-slate-500">Qty {item.quantity} · ${Number(item.price).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">Need to change something?</h2>
              <p className="mt-2 text-sm text-slate-500">If the order is still eligible, you can request cancellation from here.</p>
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate(order.id)}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                <XCircle size={16} /> {cancelMutation.isPending ? 'Cancelling...' : 'Cancel order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

function State({ message }) {
  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">{message}</div>
      </div>
    </div>
  );
}
