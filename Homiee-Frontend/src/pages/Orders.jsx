import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, PackageSearch } from 'lucide-react';
import { getMyOrders } from '../api/customer';
import SurfaceCard from '../components/SurfaceCard';
import StatePanel from '../components/StatePanel';
import StatusPill from '../components/StatusPill';
import { getResponseData } from '../utils/api';

export default function Orders() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: getMyOrders,
  });

  const orders = getResponseData(data) ?? [];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8">
          <div className="text-sm text-slate-400">
            <Link to="/profile" className="hover:text-slate-700">Profile</Link> <ChevronRight className="inline" size={14} /> Orders
          </div>
          <h1 className="mt-3 text-3xl font-black text-slate-900">Your Orders</h1>
          <p className="mt-2 text-slate-500">A dedicated history page for `api/customer/orders` so customers can browse past purchases.</p>
        </div>

        {isLoading ? (
          <StatePanel message="Loading your orders..." />
        ) : orders.length === 0 ? (
          <StatePanel message="No orders yet. Your future purchases will show up here." />
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <SurfaceCard key={order.id}>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black text-slate-900">Order #{order.id}</h2>
                      <StatusPill value={order.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                    <div className="mt-5 space-y-3">
                      {(order.items ?? []).map((item) => (
                        <div key={`${order.id}-${item.productId}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="mt-1 text-sm text-slate-500">Qty {item.quantity} · ${Number(item.price).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-60 rounded-[26px] bg-slate-900 p-6 text-white">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-300">Order Total</div>
                    <div className="mt-2 text-3xl font-black">${Number(order.totalAmount).toFixed(2)}</div>
                    <Link
                      to={`/orders/${order.id}`}
                      className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-bold text-slate-900"
                    >
                      <PackageSearch size={16} /> Track order
                    </Link>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
