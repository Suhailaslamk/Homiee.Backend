import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, Pencil, ShoppingBag, Users } from 'lucide-react';
import WorkspaceShell from '../../components/WorkspaceShell';
import { createAdminCategory, getAdminCategories, toggleAdminCategory, updateAdminCategory } from '../../api/admin';
import { useToast } from '../../hooks/useToast';
import { getResponseData } from '../../utils/api';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: Boxes },
  { label: 'Sellers', path: '/admin/sellers', icon: Users },
  { label: 'Customers', path: '/admin/customers', icon: Users },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Products', path: '/admin/products', icon: Boxes },
  { label: 'Categories', path: '/admin/categories', icon: Boxes },
];

export default function Categories() {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  });

  const categories = getResponseData(data) ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] });

  const createMutation = useMutation({
    mutationFn: () => createAdminCategory({ name }),
    onSuccess: (response) => { setName(''); refresh(); toast.success(response.message || 'Category created.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to create category.'),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateAdminCategory(editingId, { name: editingName }),
    onSuccess: (response) => { setEditingId(null); setEditingName(''); refresh(); toast.success(response.message || 'Category updated.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update category.'),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleAdminCategory,
    onSuccess: (response) => { refresh(); toast.success(response.message || 'Category toggled.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to toggle category.'),
  });

  return (
    <WorkspaceShell title="Admin Console" subtitle="Category management for marketplace and seller forms." navItems={NAV_ITEMS} accent="slate">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Categories</h1>
          <p className="mt-2 text-slate-500">Create, rename, and toggle categories from `api/admin/categories`.</p>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="New category name"
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
            <button onClick={() => createMutation.mutate()} className="rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white">
              Add Category
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <State message="Loading categories..." />
          ) : categories.length === 0 ? (
            <State message="No categories found." />
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex flex-col gap-4 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className={`rounded-2xl px-3 py-2 text-xs font-bold uppercase tracking-widest ${category.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </div>
                  {editingId === category.id ? (
                    <input value={editingName} onChange={(event) => setEditingName(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
                  ) : (
                    <div className="text-lg font-black text-slate-900">{category.name}</div>
                  )}
                </div>
                <div className="flex gap-3">
                  {editingId === category.id ? (
                    <button onClick={() => updateMutation.mutate()} className="rounded-2xl bg-blue-600 px-4 py-2 font-bold text-white">Save</button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(category.id);
                        setEditingName(category.name);
                      }}
                      className="rounded-xl p-2 text-blue-600 transition hover:bg-blue-50"
                    >
                      <Pencil size={18} />
                    </button>
                  )}
                  <button onClick={() => toggleMutation.mutate(category.id)} className="rounded-2xl bg-slate-900 px-4 py-2 font-bold text-white">
                    Toggle
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
