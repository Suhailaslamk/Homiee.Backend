import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, Search, ShoppingBag, Users } from 'lucide-react';
import WorkspaceShell from '../../components/WorkspaceShell';
import { blockCustomer, deleteCustomer, getAdminCustomers, unblockCustomer } from '../../api/admin';
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

export default function Customers() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', search, status],
    queryFn: () => getAdminCustomers({ page: 1, pageSize: 20, search, status: status || undefined }),
  });

  const customers = getPagedItems(data);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-customers'] });

  const blockMutation = useMutation({
    mutationFn: (id) => blockCustomer(id, 'Blocked from admin panel'),
    onSuccess: (response) => { refresh(); toast.success(response.message || 'Customer blocked.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to block customer.'),
  });

  const unblockMutation = useMutation({
    mutationFn: unblockCustomer,
    onSuccess: (response) => { refresh(); toast.success(response.message || 'Customer unblocked.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to unblock customer.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: (response) => { refresh(); toast.success(response.message || 'Customer deleted.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to delete customer.'),
  });

  return (
    <WorkspaceShell title="Admin Console" subtitle="Customer account controls and moderation." navItems={NAV_ITEMS} accent="slate">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Customers</h1>
            <p className="mt-2 text-slate-500">Search and moderate customer accounts from `api/admin/customers`.</p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Search size={18} className="text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers..." className="outline-none" />
            </div>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Blocked">Blocked</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <State message="Loading customers..." />
          ) : customers.length === 0 ? (
            <State message="No customers found." />
          ) : (
            customers.map((customer) => (
              <div key={customer.id} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Link to={`/admin/customers/${customer.id}`} className="text-lg font-black text-slate-900 hover:text-slate-600">
                      {customer.fullName}
                    </Link>
                    <div className="mt-1 text-sm text-slate-500">{customer.email}</div>
                    <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">{customer.status}</div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {customer.status === 'Blocked' ? (
                      <button onClick={() => unblockMutation.mutate(customer.id)} className="rounded-2xl bg-emerald-600 px-4 py-2 font-bold text-white">
                        Unblock
                      </button>
                    ) : (
                      <button onClick={() => blockMutation.mutate(customer.id)} className="rounded-2xl bg-amber-500 px-4 py-2 font-bold text-white">
                        Block
                      </button>
                    )}
                    <button onClick={() => deleteMutation.mutate(customer.id)} className="rounded-2xl bg-rose-600 px-4 py-2 font-bold text-white">
                      Delete
                    </button>
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
