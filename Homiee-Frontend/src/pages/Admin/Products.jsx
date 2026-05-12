import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Boxes, 
  ShoppingBag, 
  Trash2, 
  Users, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Package,
  Store,
  Tag,
  Filter,
  ArrowUpRight,
  Plus,
  Eye,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SurfaceCard from '../../components/SurfaceCard';
import StatusPill from '../../components/StatusPill';
import StatePanel from '../../components/StatePanel';
import { deleteAdminProduct, getAdminProducts, getAdminCategories } from '../../api/admin';
import { useToast } from '../../hooks/useToast';
import { getPagedItems, getPagedMeta, getResponseData } from '../../utils/api';

export default function Products() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: categoriesResponse } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  });
  const categories = getResponseData(categoriesResponse) ?? [];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-products', status, search, categoryId, page],
    queryFn: () => getAdminProducts({ page, pageSize, status: status || undefined, search: search || undefined }),
  });

  const products = getPagedItems(data);
  const { totalPages } = getPagedMeta(data);

  const mutation = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(response.message || 'Product record purged.');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to purge record.'),
  });

  return (
    <div className="space-y-12">
      {/* Editorial Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary-dark)] text-white text-[10px] font-bold uppercase tracking-widest mb-6">
            <Package size={14} /> Inventory Governance
          </div>
          <h1 className="text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight">
            The <i className="text-[var(--color-accent)]">Catalog.</i>
          </h1>
          <p className="mt-4 text-xl text-[var(--color-text-muted)] font-medium max-w-2xl">
            A comprehensive audit of the artisanal creations and curated collections across the Homiee marketplace.
          </p>
        </div>
      </header>

      {/* Advanced Filter Bar */}
      <div className="bg-white rounded-[2.5rem] p-4 shadow-xl border border-[var(--color-stone)]/5 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
          <input
            type="text"
            placeholder="Search catalog by product name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-16 pr-6 py-5 rounded-2xl bg-[var(--color-sand)]/20 border-transparent focus:bg-white focus:border-[var(--color-accent)] transition-all outline-none font-medium text-[var(--color-primary-dark)]"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-56">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
            <select 
              value={categoryId} 
              onChange={(event) => { setCategoryId(event.target.value); setPage(1); }} 
              className="w-full pl-12 pr-4 py-5 rounded-2xl bg-[var(--color-sand)]/20 border-transparent outline-none font-bold text-sm text-[var(--color-primary-dark)] appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full md:w-56">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
            <select 
              value={status} 
              onChange={(event) => { setStatus(event.target.value); setPage(1); }} 
              className="w-full pl-12 pr-4 py-5 rounded-2xl bg-[var(--color-sand)]/20 border-transparent outline-none font-bold text-sm text-[var(--color-primary-dark)] appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Approved">Live Gallery</option>
              <option value="Submitted">Awaiting Review</option>
              <option value="Draft">Draft Listings</option>
              <option value="Rejected">Flagged Items</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Registry */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-[2.5rem] bg-[var(--color-sand)]/20" />
            ))}
          </div>
        ) : error ? (
          <StatePanel
            className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[2.5rem]"
            message={(
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--color-primary-dark)] mb-4">The catalog failed to synchronize.</p>
                <button onClick={() => refetch()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry Synchronization</button>
              </div>
            )}
          />
        ) : products.length === 0 ? (
          <SurfaceCard className="bg-white border-[var(--color-stone)]/10 text-center py-24 rounded-[3rem]">
            <Package size={64} className="mx-auto text-[var(--color-sand)] mb-6" />
            <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">No Products Found</h3>
            <p className="mt-2 text-[var(--color-text-muted)] font-medium">Refine your catalog search to discover artisan listings.</p>
          </SurfaceCard>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid gap-6">
              {products.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <SurfaceCard className="bg-white border-[var(--color-stone)]/5 shadow-xl hover:shadow-2xl hover:border-[var(--color-accent)]/20 transition-all rounded-[2.5rem] p-6 group">
                    <div className="flex flex-col xl:flex-row items-center gap-8">
                      {/* Product Identity */}
                      <div className="flex items-center gap-6 flex-1 min-w-0 w-full">
                        <div className="w-24 h-24 rounded-[2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)] shrink-0 shadow-inner overflow-hidden group-hover:scale-105 transition-transform">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package size={32} className="opacity-30" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <Link to={`/admin/products/${product.id}`} className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                              {product.name}
                            </Link>
                            <StatusPill value={product.status || 'Draft'} />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[var(--color-text-muted)] font-medium text-sm">
                            <span className="flex items-center gap-2"><Store size={14} className="text-[var(--color-accent)]" /> {product.sellerName || 'Artisan Studio'}</span>
                            <span className="flex items-center gap-2"><Tag size={14} className="text-[var(--color-primary)]" /> {product.categoryName || 'General Curation'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Valuation & Action */}
                      <div className="flex flex-wrap items-center gap-8 w-full xl:w-auto justify-end">
                        <div className="text-right">
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1">Market Valuation</div>
                          <div className="text-3xl font-bold text-[var(--color-primary-dark)]">{formatCurrency(product.price)}</div>
                        </div>

                        <div className="flex items-center gap-3 border-l border-[var(--color-stone)]/10 pl-8">
                          <button 
                            onClick={() => {
                              if (window.confirm('Purge this product listing from the global catalog?')) {
                                mutation.mutate(product.id);
                              }
                            }}
                            disabled={mutation.isPending}
                            className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            title="Purge Listing"
                          >
                            <Trash2 size={20} />
                          </button>
                          <Link 
                            to={`/admin/products/${product.id}`}
                            className="px-8 py-4 rounded-2xl bg-[var(--color-primary-dark)] text-white font-bold text-sm hover:bg-[var(--color-accent)] transition-all flex items-center gap-2 shadow-lg shadow-[var(--color-primary-dark)]/10"
                          >
                            Edit Listing <ArrowUpRight size={18} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </SurfaceCard>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Refined Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 py-12">
          <button 
            disabled={page === 1}
            onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="w-14 h-14 rounded-full bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 hover:bg-[var(--color-sand)]/20 transition-all shadow-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="px-8 py-4 rounded-full bg-white border border-[var(--color-stone)]/10 text-sm font-bold text-[var(--color-primary-dark)] shadow-lg uppercase tracking-widest">
            Page <span className="text-[var(--color-accent)]">{page}</span> of {totalPages}
          </div>
          <button 
            disabled={page === totalPages}
            onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="w-14 h-14 rounded-full bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 hover:bg-[var(--color-sand)]/20 transition-all shadow-lg"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}
