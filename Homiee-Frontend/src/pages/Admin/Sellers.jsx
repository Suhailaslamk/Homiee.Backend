import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, ShoppingBag, Users } from 'lucide-react';
import WorkspaceShell from '../../components/WorkspaceShell';
import { approveSeller, getAdminSellers, rejectSeller, suspendSeller } from '../../api/admin';
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

export default function Sellers() {
  const [status, setStatus] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sellers', status],
    queryFn: () => getAdminSellers({ page: 1, pageSize: 20, status: status || undefined }),
  });

  const sellers = getPagedItems(data);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });

  const approveMutation = useMutation({
    mutationFn: approveSeller,
    onSuccess: (response) => { refresh(); toast.success(response.message || 'Seller approved.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to approve seller.'),
  });

  const rejectMutation = useMutation({
    mutationFn: (userId) => rejectSeller(userId, 'Requires additional verification documents'),
    onSuccess: (response) => { refresh(); toast.success(response.message || 'Seller rejected.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to reject seller.'),
  });

  const suspendMutation = useMutation({
    mutationFn: (userId) => suspendSeller(userId, 'Suspended from admin workspace'),
    onSuccess: (response) => { refresh(); toast.success(response.message || 'Seller suspended.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to suspend seller.'),
  });

  return (
    <WorkspaceShell title="Admin Console" subtitle="Review seller applications and active merchants." navItems={NAV_ITEMS} accent="slate">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Sellers</h1>
            <p className="mt-2 text-slate-500">This page is built around `api/admin/sellers` and seller moderation actions.</p>
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <option value="">All sellers</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <State message="Loading sellers..." />
          ) : sellers.length === 0 ? (
            <State message="No sellers found." />
          ) : (
            sellers.map((seller) => (
              <div key={seller.userId || seller.id} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Link to={`/admin/sellers/${seller.userId}`} className="text-lg font-black text-slate-900 hover:text-slate-600">
                      {seller.businessName}
                    </Link>
                    <div className="mt-1 text-sm text-slate-500">{seller.name || 'Seller'} · {seller.email || seller.phoneNumber || 'Contact unavailable'}</div>
                    <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">{seller.status || 'Unknown status'}</div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => approveMutation.mutate(seller.userId)} className="rounded-2xl bg-emerald-600 px-4 py-2 font-bold text-white">Approve</button>
                    <button onClick={() => rejectMutation.mutate(seller.userId)} className="rounded-2xl bg-amber-500 px-4 py-2 font-bold text-white">Reject</button>
                    <button onClick={() => suspendMutation.mutate(seller.userId)} className="rounded-2xl bg-rose-600 px-4 py-2 font-bold text-white">Suspend</button>
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
