import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, DollarSign, Package, ShoppingBag } from 'lucide-react';
import WorkspaceShell from '../../components/WorkspaceShell';
import { createSellerProduct, getSellerCategories, getSellerProduct, updateSellerProduct } from '../../api/seller';
import { useToast } from '../../hooks/useToast';
import { getResponseData } from '../../utils/api';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/seller/dashboard', icon: ShoppingBag },
  { label: 'Inventory', path: '/seller/inventory', icon: Package },
  { label: 'Orders', path: '/seller/orders', icon: DollarSign },
];

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  stock: '',
  categoryId: '',
  image: null,
};

export default function ProductForm() {
  const { productId } = useParams();
  const isEdit = Boolean(productId);
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({});

  const { data: categoriesResponse } = useQuery({
    queryKey: ['seller-categories'],
    queryFn: getSellerCategories,
  });

  const { data: productResponse } = useQuery({
    queryKey: ['seller-product', productId],
    queryFn: () => getSellerProduct(productId),
    enabled: isEdit,
  });

  const categories = getResponseData(categoriesResponse) ?? [];
  const product = getResponseData(productResponse);
  const form = {
    name: draft.name ?? product?.name ?? EMPTY_FORM.name,
    description: draft.description ?? product?.description ?? EMPTY_FORM.description,
    price: draft.price ?? product?.price ?? EMPTY_FORM.price,
    stock: draft.stock ?? product?.stock ?? EMPTY_FORM.stock,
    categoryId: draft.categoryId ?? product?.categoryId ?? EMPTY_FORM.categoryId,
    image: draft.image ?? EMPTY_FORM.image,
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        return updateSellerProduct(productId, {
          name: form.name,
          description: form.description,
          price: Number(form.price),
          stock: Number(form.stock),
        });
      }

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('stock', form.stock);
      formData.append('categoryId', form.categoryId);
      if (form.image) {
        formData.append('image', form.image);
      }
      return createSellerProduct(formData);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['seller-inventory'] });
      toast.success(response.message || `Product ${isEdit ? 'updated' : 'created'} successfully.`);
      navigate('/seller/inventory');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to save product.'),
  });

  return (
    <WorkspaceShell title="Seller Workspace" subtitle="Create and edit product listings." navItems={NAV_ITEMS}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">{isEdit ? 'Edit Product' : 'New Product'}</h1>
            <p className="mt-2 text-slate-500">Seller product endpoints use form-data for creation and JSON for updates.</p>
          </div>
          <Link to="/seller/inventory" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
            <ArrowLeft size={16} /> Back to inventory
          </Link>
        </div>

      <form
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
          className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Input label="Product Name" value={form.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} />
            <Input label="Price" type="number" value={form.price} onChange={(value) => setDraft((current) => ({ ...current, price: value }))} />
            <div className="md:col-span-2">
              <TextArea label="Description" value={form.description} onChange={(value) => setDraft((current) => ({ ...current, description: value }))} />
            </div>
            <Input label="Stock" type="number" value={form.stock} onChange={(value) => setDraft((current) => ({ ...current, stock: value }))} />
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Category</span>
              <select
                value={form.categoryId}
                onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-600"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            {!isEdit && (
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Primary Image</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(event) => setDraft((current) => ({ ...current, image: event.target.files?.[0] ?? null }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </label>
            )}
          </div>
          <div className="mt-8 flex gap-4">
            <button type="submit" className="rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-blue-600">
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
            <Link to="/seller/inventory" className="rounded-2xl bg-slate-100 px-6 py-3 font-bold text-slate-700">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </WorkspaceShell>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-600" />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <textarea
        rows="5"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-600"
      />
    </label>
  );
}
