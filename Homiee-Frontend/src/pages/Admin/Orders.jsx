import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, ShoppingBag, Users } from 'lucide-react';
import WorkspaceShell from '../../components/WorkspaceShell';
import { getAdminOrders, updateAdminOrderStatus } from '../../api/admin';
import { useToast } from '../../hooks/useToast';
import { getPagedItems } from '../../utils/api';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: Boxes },
  { label: 'Sellers', path: '/admin/sellers', icon: Users },
  { label: 'Customers', path: '/admin/customers', icon: Users },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Products', path: '/admin/products', icon: Boxes },
  { label: 'Categories', path: '/admin/categories', icon: Boxes },
];

const STATUS_OPTIONS = ['Pending', 'Processing', 'Paid', 'Shipped', 'Delivered', 'Cancelled'];

export default function Orders() {
  const [status, setStatus] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status],
    queryFn: () => getAdminOrders({ page: 1, pageSize: 20, status: status || undefined }),
  });

  const orders = getPagedItems(data);

  const mutation = useMutation({
    mutationFn: ({ id, nextStatus }) => updateAdminOrderStatus(id, nextStatus),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(response.message || 'Order status updated.');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update order status.'),
  });

  return (
    <WorkspaceShell title="Admin Console" subtitle="Platform order monitoring and intervention." navItems={NAV_ITEMS} accent="slate">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Orders</h1>
            <p className="mt-2 text-slate-500">Manage order statuses from `api/admin/orders`.</p>
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <State message="Loading admin orders..." />
          ) : orders.length === 0 ? (
            <State message="No orders found." />
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-black text-slate-900">Order #{order.id}</div>
                    <div className="mt-1 text-sm text-slate-500">User #{order.userId} · Seller #{order.sellerId}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Total</div>
                      <div className="font-black text-slate-900">${Number(order.totalAmount).toFixed(2)}</div>
                    </div>
                    <select
                      value={order.status}
                      onChange={(event) => mutation.mutate({ id: order.id, nextStatus: event.target.value })}
                      className="rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-700"
                    >
                      {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
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

function State({ message }) {
  return <div className="rounded-[30px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">{message}</div>;
}
