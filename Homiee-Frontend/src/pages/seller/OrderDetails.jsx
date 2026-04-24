import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, DollarSign, Mail, Package, ShoppingBag, User } from 'lucide-react';
import WorkspaceShell from '../../components/WorkspaceShell';
import StatePanel from '../../components/StatePanel';
import StatusPill from '../../components/StatusPill';
import SurfaceCard from '../../components/SurfaceCard';
import { getSellerOrderById, updateSellerOrderStatus } from '../../api/seller';
import { useToast } from '../../hooks/useToast';
import { getResponseData } from '../../utils/api';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/seller/dashboard', icon: ShoppingBag },
  { label: 'Inventory', path: '/seller/inventory', icon: Package },
  { label: 'Orders', path: '/seller/orders', icon: DollarSign },
];

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function SellerOrderDetails() {
  const { orderId } = useParams();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['seller-order', orderId],
    queryFn: () => getSellerOrderById(orderId),
    enabled: Boolean(orderId),
  });

  const order = getResponseData(data);

  const mutation = useMutation({
    mutationFn: (status) => updateSellerOrderStatus(orderId, status),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['seller-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      toast.success(response.message || 'Order status updated.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to update seller order.');
    },
  });

  return (
    <WorkspaceShell title="Seller Workspace" subtitle="Detailed order view for individual seller orders." navItems={NAV_ITEMS}>
      {isLoading || !order ? (
        <StatePanel message="Loading order details..." />
      ) : (
        <div className="space-y-8">
          <div>
            <Link to="/seller/orders" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
              <ChevronLeft size={16} /> Back to orders
            </Link>
            <h1 className="mt-4 text-3xl font-black text-slate-900">Order #{order.orderId}</h1>
            <p className="mt-2 text-slate-500">Powered by `api/seller/orders/order/{orderId}` for customer and item-level order detail.</p>
          </div>

          <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-8">
              <SurfaceCard>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Status</div>
                    <div className="mt-3"><StatusPill value={order.status} /></div>
                  </div>
                  <select
                    value={order.status}
                    onChange={(event) => mutation.mutate(event.target.value)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-700"
                  >
                    {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Metric label="Created" value={new Date(order.createdAt).toLocaleString()} />
                  <Metric label="Seller Total" value={`$${Number(order.totalAmount).toFixed(2)}`} />
                </div>
              </SurfaceCard>

              <SurfaceCard>
                <h2 className="text-xl font-black text-slate-900">Customer</h2>
                <div className="mt-5 space-y-4">
                  <DetailRow icon={<User size={18} />} label="Customer Name" value={order.customerName} />
                  <DetailRow icon={<Mail size={18} />} label="Customer Email" value={order.customerEmail} />
                </div>
              </SurfaceCard>
            </div>

            <SurfaceCard>
              <h2 className="text-xl font-black text-slate-900">Order Items</h2>
              <div className="mt-6 space-y-4">
                {(order.items ?? []).map((item) => (
                  <div key={item.productId} className="rounded-[24px] border border-slate-200 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-black text-slate-900">{item.productName}</div>
                        <div className="mt-1 text-sm text-slate-500">Product #{item.productId}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-sm text-slate-500">Qty {item.quantity}</div>
                        <div className="font-black text-slate-900">${Number(item.price).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-[24px] bg-slate-50 p-5">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-3 text-slate-500">
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-3 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}
