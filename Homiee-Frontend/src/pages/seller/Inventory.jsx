import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import WorkspaceShell from '../../components/WorkspaceShell';
import SafeImage from '../../components/SafeImage';
import { deleteSellerProduct, getSellerInventory, updateSellerProductStock } from '../../api/seller';
import { useToast } from '../../hooks/useToast';
import { getPagedItems } from '../../utils/api';
import { Package, ShoppingBag, DollarSign } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/seller/dashboard', icon: ShoppingBag },
  { label: 'Inventory', path: '/seller/inventory', icon: Package },
  { label: 'Orders', path: '/seller/orders', icon: DollarSign },
];

export default function Inventory() {
  const [search, setSearch] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['seller-inventory', search],
    queryFn: () => getSellerInventory({ page: 1, pageSize: 20, search }),
  });

  const products = getPagedItems(data);

  const deleteMutation = useMutation({
    mutationFn: deleteSellerProduct,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['seller-inventory'] });
      toast.success(response.message || 'Product removed.');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to delete product.'),
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, stock }) => updateSellerProductStock(id, stock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-inventory'] });
      toast.success('Stock updated.');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update stock.'),
  });

  return (
    <WorkspaceShell title="Seller Workspace" subtitle="Manage products and stock." navItems={NAV_ITEMS}>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Inventory</h1>
            <p className="mt-2 text-slate-500">Products from `api/seller/products` with quick stock and delete actions.</p>
          </div>
          <Link to="/seller/products/new" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-blue-600">
            <Plus size={18} /> Add product
          </Link>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search inventory by product name..."
              className="w-full outline-none"
            />
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">Loading inventory...</div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="flex flex-col gap-4 rounded-[24px] border border-slate-200 p-4 md:flex-row md:items-center">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
                    <SafeImage src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900">{product.name}</div>
                    <div className="text-sm text-slate-500">Seller view · Product #{product.id}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-500">
                      Stock
                      <input
                        type="number"
                        min="0"
                        defaultValue={product.stock ?? 0}
                        onBlur={(event) => stockMutation.mutate({ id: product.id, stock: Number(event.target.value) })}
                        className="ml-2 w-24 rounded-xl border border-slate-200 px-3 py-2"
                      />
                    </label>
                    <div className="text-right">
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Price</div>
                      <div className="font-black text-slate-900">${Number(product.price).toFixed(2)}</div>
                    </div>
                    <Link to={`/seller/products/${product.id}/edit`} className="rounded-xl p-2 text-blue-600 transition hover:bg-blue-50">
                      <Pencil size={18} />
                    </Link>
                    <button onClick={() => deleteMutation.mutate(product.id)} className="rounded-xl p-2 text-rose-600 transition hover:bg-rose-50">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">No products found.</div>}
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
