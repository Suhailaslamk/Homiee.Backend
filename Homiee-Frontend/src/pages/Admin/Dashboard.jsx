import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Boxes, DollarSign, ShoppingBag, Users } from 'lucide-react';
import WorkspaceShell from '../../components/WorkspaceShell';
import { getAdminDashboard, getAdminOrders, getAdminSellers } from '../../api/admin';
import { getPagedItems, getResponseData } from '../../utils/api';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: Boxes },
  { label: 'Sellers', path: '/admin/sellers', icon: Users },
  { label: 'Customers', path: '/admin/customers', icon: Users },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Products', path: '/admin/products', icon: Boxes },
  { label: 'Categories', path: '/admin/categories', icon: Boxes },
];

export default function AdminDashboard() {
  const { data: dashboardResponse, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
  });

  const { data: sellersResponse } = useQuery({
    queryKey: ['admin-sellers-preview'],
    queryFn: () => getAdminSellers({ page: 1, pageSize: 5, status: 'Submitted' }),
  });

  const { data: ordersResponse } = useQuery({
    queryKey: ['admin-orders-preview'],
    queryFn: () => getAdminOrders({ page: 1, pageSize: 5 }),
  });

  const dashboard = getResponseData(dashboardResponse);
  const sellers = getPagedItems(sellersResponse);
  const orders = getPagedItems(ordersResponse);

  return (
    <WorkspaceShell title="Admin Console" subtitle="Platform-wide controls and audit views." navItems={NAV_ITEMS} accent="slate">
      {isLoading || !dashboard ? (
        <State message="Loading admin dashboard..." />
      ) : (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Platform Overview</h1>
            <p className="mt-2 text-slate-500">Metrics are being pulled from the admin dashboard endpoints.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Users" value={dashboard.totalUsers} icon={<Users size={20} />} />
            <StatCard label="Total Sellers" value={dashboard.totalSellers} icon={<Boxes size={20} />} />
            <StatCard label="Total Orders" value={dashboard.totalOrders} icon={<ShoppingBag size={20} />} />
            <StatCard label="Revenue" value={`$${Number(dashboard.totalRevenue).toFixed(2)}`} icon={<DollarSign size={20} />} />
          </div>

          <div className="grid gap-8 xl:grid-cols-2">
            <section className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">Seller Review Queue</h2>
              <div className="mt-6 space-y-3">
                {sellers.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">No submitted sellers waiting for review.</div>
                ) : (
                  sellers.map((seller) => (
                    <div key={seller.userId || seller.id} className="rounded-2xl bg-slate-50 px-4 py-4">
                      <div className="font-bold text-slate-900">{seller.businessName}</div>
                      <div className="mt-1 text-sm text-slate-500">{seller.name || seller.email || 'Seller record'}</div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">Recent Orders</h2>
              <div className="mt-6 space-y-3">
                {orders.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">No recent orders available.</div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
                      <div>
                        <div className="font-bold text-slate-900">Order #{order.id}</div>
                        <div className="mt-1 text-sm text-slate-500">{order.status}</div>
                      </div>
                      <div className="font-black text-slate-900">${Number(order.totalAmount).toFixed(2)}</div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="rounded-2xl bg-slate-100 p-3 text-slate-900 inline-flex">
        {icon}
      </div>
      <div className="mt-5 text-xs font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function State({ message }) {
  return <div className="rounded-[30px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">{message}</div>;
}
