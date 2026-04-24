import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Package, ShoppingBag, TriangleAlert } from 'lucide-react';
import WorkspaceShell from '../../components/WorkspaceShell';
import { getSellerDashboard, getSellerOrders } from '../../api/seller';
import { getPagedItems, getResponseData } from '../../utils/api';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/seller/dashboard', icon: ShoppingBag },
  { label: 'Inventory', path: '/seller/inventory', icon: Package },
  { label: 'Orders', path: '/seller/orders', icon: DollarSign },
];

export default function SellerDashboard() {
  const { data: dashboardResponse, isLoading } = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: getSellerDashboard,
  });

  const { data: ordersResponse } = useQuery({
    queryKey: ['seller-orders-preview'],
    queryFn: () => getSellerOrders({ page: 1, pageSize: 5 }),
  });

  const dashboard = getResponseData(dashboardResponse);
  const recentOrders = getPagedItems(ordersResponse);

  return (
    <WorkspaceShell
      title="Seller Workspace"
      subtitle="Inventory, orders, and performance powered by your seller endpoints."
      navItems={NAV_ITEMS}
    >
      {isLoading || !dashboard ? (
        <State message="Loading seller dashboard..." />
      ) : (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Business Overview</h1>
            <p className="mt-2 text-slate-500">Your live seller metrics from `api/dashboard/seller`.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Products" value={dashboard.totalProducts} icon={<Package size={20} />} />
            <StatCard label="Total Orders" value={dashboard.totalOrders} icon={<ShoppingBag size={20} />} />
            <StatCard label="Revenue" value={`$${Number(dashboard.totalRevenue).toFixed(2)}`} icon={<DollarSign size={20} />} />
            <StatCard label="Low Stock" value={dashboard.lowStockProducts} icon={<TriangleAlert size={20} />} />
          </div>

          <section className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Recent Orders</h2>
            <div className="mt-6 space-y-3">
              {recentOrders.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">No recent orders yet.</div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
                    <div>
                      <div className="font-bold text-slate-900">Order #{order.id}</div>
                      <div className="text-sm text-slate-500">{order.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">${Number(order.totalAmount).toFixed(2)}</div>
                      <div className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </WorkspaceShell>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-[#fff1e8] p-3 text-[#b85c38]">
          {icon}
        </div>
      </div>
      <div className="mt-5 text-xs font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function State({ message }) {
  return <div className="rounded-[30px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">{message}</div>;
}
