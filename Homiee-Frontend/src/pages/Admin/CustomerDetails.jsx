import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Boxes, Calendar, ChevronLeft, Mail, ShoppingBag, Users } from 'lucide-react';
import WorkspaceShell from '../../components/WorkspaceShell';
import StatePanel from '../../components/StatePanel';
import StatusPill from '../../components/StatusPill';
import SurfaceCard from '../../components/SurfaceCard';
import { getAdminCustomerById, getAdminCustomerOrders } from '../../api/admin';
import { getResponseData } from '../../utils/api';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: Boxes },
  { label: 'Sellers', path: '/admin/sellers', icon: Users },
  { label: 'Customers', path: '/admin/customers', icon: Users },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Products', path: '/admin/products', icon: Boxes },
  { label: 'Categories', path: '/admin/categories', icon: Boxes },
];

export default function CustomerDetails() {
  const { customerId } = useParams();

  const { data: customerResponse, isLoading } = useQuery({
    queryKey: ['admin-customer', customerId],
    queryFn: () => getAdminCustomerById(customerId),
    enabled: Boolean(customerId),
  });

  const { data: ordersResponse } = useQuery({
    queryKey: ['admin-customer-orders', customerId],
    queryFn: () => getAdminCustomerOrders(customerId),
    enabled: Boolean(customerId),
  });

  const customer = getResponseData(customerResponse);
  const orders = getResponseData(ordersResponse) ?? [];

  return (
    <WorkspaceShell title="Admin Console" subtitle="Customer account details and order history." navItems={NAV_ITEMS} accent="slate">
      {isLoading || !customer ? (
        <StatePanel message="Loading customer details..." />
      ) : (
        <div className="space-y-8">
          <div>
            <Link to="/admin/customers" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
              <ChevronLeft size={16} /> Back to customers
            </Link>
            <h1 className="mt-4 text-3xl font-black text-slate-900">{customer.fullName}</h1>
            <p className="mt-2 text-slate-500">Detail screen for `api/admin/customers/{customerId}` and `api/admin/customers/{customerId}/orders`.</p>
          </div>

          <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
            <SurfaceCard>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Customer Status</div>
                    <div className="mt-3"><StatusPill value={customer.status} /></div>
                  </div>
                  <div className="rounded-3xl bg-slate-900 px-4 py-3 text-white">#{customer.id}</div>
                </div>
                <DetailRow icon={<Mail size={18} />} label="Email" value={customer.email} />
                <DetailRow icon={<Calendar size={18} />} label="Joined" value={new Date(customer.createdAt).toLocaleString()} />
                <DetailRow icon={<Users size={18} />} label="Email Verified" value={customer.isEmailVerified ? 'Yes' : 'No'} />
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <h2 className="text-xl font-black text-slate-900">Customer Orders</h2>
              <div className="mt-6 space-y-4">
                {orders.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">No orders found for this customer.</div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="rounded-[24px] border border-slate-200 p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-black text-slate-900">Order #{order.id}</div>
                          <div className="mt-1 text-sm text-slate-500">{new Date(order.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <StatusPill value={order.status} />
                          <div className="font-black text-slate-900">${Number(order.totalAmount).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SurfaceCard>
          </div>
        </div>
      )}
    </WorkspaceShell>
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
