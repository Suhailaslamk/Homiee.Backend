import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, ShoppingBag, Trash2, Users } from 'lucide-react';
import WorkspaceShell from '../../components/WorkspaceShell';
import { deleteAdminProduct, getAdminProducts } from '../../api/admin';
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

export default function Products() {
  const [status, setStatus] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', status],
    queryFn: () => getAdminProducts({ page: 1, pageSize: 20, status: status || undefined }),
  });

  const products = getPagedItems(data);

  const mutation = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(response.message || 'Product deleted.');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to delete product.'),
  });

  return (
    <WorkspaceShell title="Admin Console" subtitle="Review and remove product listings." navItems={NAV_ITEMS} accent="slate">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Products</h1>
            <p className="mt-2 text-slate-500">Inventory oversight from `api/admin/products`.</p>
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <option value="">All products</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <State message="Loading products..." />
          ) : products.length === 0 ? (
            <State message="No products found." />
          ) : (
            products.map((product) => (
              <div key={product.id} className="flex flex-col gap-4 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <Link to={`/admin/products/${product.id}`} className="text-lg font-black text-slate-900 hover:text-slate-600">
                    {product.name}
                  </Link>
                  <div className="mt-1 text-sm text-slate-500">{product.sellerName} · {product.status}</div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">{new Date(product.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-black text-slate-900">${Number(product.price).toFixed(2)}</div>
                  <button onClick={() => mutation.mutate(product.id)} className="rounded-xl p-2 text-rose-600 transition hover:bg-rose-50">
                    <Trash2 size={18} />
                  </button>
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
