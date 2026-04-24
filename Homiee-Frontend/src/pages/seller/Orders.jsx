import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Package, Search, ShoppingBag } from 'lucide-react';
import WorkspaceShell from '../../components/WorkspaceShell';
import { getSellerOrders, updateSellerOrderStatus } from '../../api/seller';
import { useToast } from '../../hooks/useToast';
import { getPagedItems } from '../../utils/api';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/seller/dashboard', icon: ShoppingBag },
  { label: 'Inventory', path: '/seller/inventory', icon: Package },
  { label: 'Orders', path: '/seller/orders', icon: DollarSign },
];

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function SellerOrders() {
  const [status, setStatus] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['seller-orders', status],
    queryFn: () => getSellerOrders({ page: 1, pageSize: 20, status: status || undefined }),
  });

  const orders = getPagedItems(data);

  const mutation = useMutation({
    mutationFn: ({ id, nextStatus }) => updateSellerOrderStatus(id, nextStatus),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      toast.success(response.message || 'Order status updated.');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update order status.'),
  });

  return (
    <WorkspaceShell title="Seller Workspace" subtitle="Track and update seller orders." navItems={NAV_ITEMS}>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Orders</h1>
            <p className="mt-2 text-slate-500">Live orders from `api/seller/orders`.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="bg-transparent outline-none">
              <option value="">All statuses</option>
              {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-[30px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Loading seller orders...</div>
          ) : orders.length === 0 ? (
            <div className="rounded-[30px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">No orders found.</div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Link to={`/seller/orders/${order.id}`} className="text-lg font-black text-slate-900 hover:text-slate-600">
                      Order #{order.id}
                    </Link>
                    <div className="mt-1 text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleString()} · {order.itemCount} items
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Amount</div>
                      <div className="font-black text-slate-900">${Number(order.totalAmount).toFixed(2)}</div>
                    </div>
                    <select
                      value={order.status}
                      onChange={(event) => mutation.mutate({ id: order.id, nextStatus: event.target.value })}
                      className="rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-700"
                    >
                      {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
