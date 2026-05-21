import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeIndianRupee,
  Grid2X2,
  LayoutList,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeImage from '../../components/SafeImage';
import StatePanel from '../../components/StatePanel';
import SurfaceCard from '../../components/SurfaceCard';
import StatusPill from '../../components/StatusPill';
import {
  deleteSellerProduct,
  getSellerCategories,
  getSellerInventory,
  updateSellerProductStock,
} from '../../api/seller';
import { useToast } from '../../hooks/useToast';
import { getPagedItems, getPagedMeta, getResponseData } from '../../utils/api';

const PAGE_SIZE = 12;

export default function Inventory() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('grid');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [editingStockId, setEditingStockId] = useState(null);
  const [stockDrafts, setStockDrafts] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    categoryId: '',
    inStockOnly: false,
    sortBy: 'newest',
    desc: true,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setFilters((current) => ({ ...current, page: 1 }));
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const inventoryQuery = useMemo(
    () => ({
      page: filters.page,
      pageSize: filters.pageSize,
      search: search || undefined,
      categoryId: filters.categoryId || undefined,
      inStockOnly: filters.inStockOnly ? true : undefined,
      sortBy: resolveSort(filters.sortBy),
      desc: filters.sortBy === 'price' ? filters.desc : true,
    }),
    [filters, search]
  );

  const {
    data: inventoryResponse,
    isLoading: inventoryLoading,
    error: inventoryError,
    refetch: refetchInventory,
  } = useQuery({
    queryKey: ['seller-inventory', inventoryQuery],
    queryFn: () => getSellerInventory(inventoryQuery),
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['seller-categories'],
    queryFn: getSellerCategories,
  });

  const products = getPagedItems(inventoryResponse);
  const inventoryMeta = getPagedMeta(inventoryResponse);
  const totalPages = Math.max(
    1,
    inventoryResponse?.data?.totalPages || Math.ceil((inventoryMeta.totalCount || 0) / (inventoryMeta.pageSize || PAGE_SIZE)) || 1
  );
  const categories = getResponseData(categoriesResponse) ?? [];

  const deleteMutation = useMutation({
    mutationFn: deleteSellerProduct,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['seller-inventory'] });
      toast.success(response?.message || 'Product deleted successfully.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to delete product.');
    },
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, stock }) => updateSellerProductStock(id, stock),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller-inventory'] });
      toast.success('Stock updated.');
      setEditingStockId(null);
      setStockDrafts((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to update stock.');
    },
  });

  return (
    <div className="space-y-12 pb-20">
      {/* Catalog Header */}
      <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[4rem] bg-[var(--color-sand)]/30 p-8 sm:p-12 shadow-inner">
        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-dark)] flex items-center justify-center text-white shadow-lg">
                <Package size={24} />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-primary-dark)]">Catalog</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight">Product Inventory</h1>
            <p className="mt-4 text-[var(--color-text-muted)] font-medium leading-relaxed italic">
              "Manage your product listings and stock levels."
            </p>
          </div>

          <Link
            to="/seller/products/new"
            className="group flex items-center gap-3 px-8 py-4 sm:py-5 bg-[var(--color-primary-dark)] text-white rounded-2xl sm:rounded-[2rem] font-bold shadow-2xl hover:scale-[1.02] transition-all"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            Add Product
          </Link>
        </div>
      </section>

      {/* Curation Suite */}
      <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-8 shadow-xl rounded-[3rem]">
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr,1fr,auto]">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-stone)] group-focus-within:text-[var(--color-accent)] transition-colors" size={20} />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search products..."
              className="w-full h-16 rounded-[1.5rem] bg-[var(--color-sand)]/20 border-2 border-transparent focus:border-[var(--color-accent)]/20 focus:bg-white px-14 text-[var(--color-primary-dark)] font-bold placeholder:text-[var(--color-stone)]/50 transition-all outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-stone)] pointer-events-none" size={18} />
            <select
              value={filters.categoryId}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, categoryId: event.target.value }))}
              className="w-full h-16 rounded-[1.5rem] bg-[var(--color-sand)]/20 border-2 border-transparent focus:border-[var(--color-accent)]/20 focus:bg-white pl-14 pr-6 appearance-none text-[var(--color-primary-dark)] font-bold cursor-pointer transition-all outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-stone)] pointer-events-none" size={18} />
            <select
              value={filters.sortBy}
              onChange={(event) => setFilters((current) => ({ ...current, page: 1, sortBy: event.target.value }))}
              className="w-full h-16 rounded-[1.5rem] bg-[var(--color-sand)]/20 border-2 border-transparent focus:border-[var(--color-accent)]/20 focus:bg-white pl-14 pr-6 appearance-none text-[var(--color-primary-dark)] font-bold cursor-pointer transition-all outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="price">Price Ranking</option>
            </select>
          </div>

          <div className="flex gap-2 p-2 bg-[var(--color-sand)]/20 rounded-[1.5rem]">
            <ViewModeButton active={viewMode === 'grid'} onClick={() => setViewMode('grid')} icon={<Grid2X2 size={20} />} />
            <ViewModeButton active={viewMode === 'table'} onClick={() => setViewMode('table')} icon={<LayoutList size={20} />} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-[var(--color-stone)]/5">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Total:</span>
              <span className="text-sm font-bold text-[var(--color-primary-dark)]">{inventoryMeta.totalCount || products.length} Products</span>
            </div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => setFilters((current) => ({ ...current, page: 1, inStockOnly: !current.inStockOnly }))}
                className={`w-12 h-6 rounded-full transition-all relative ${filters.inStockOnly ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-stone)]/30'}`}
              >
                <motion.div 
                  animate={{ x: filters.inStockOnly ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] group-hover:text-[var(--color-primary-dark)] transition-colors">In-Stock Only</span>
            </label>
          </div>

          <button
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setFilters({
                page: 1,
                pageSize: PAGE_SIZE,
                categoryId: '',
                inStockOnly: false,
                sortBy: 'newest',
                desc: true,
              });
            }}
            className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest hover:tracking-[0.2em] transition-all"
          >
            Clear Filters
          </button>
        </div>
      </SurfaceCard>

      {/* Inventory Display */}
      {inventoryLoading ? (
        <InventoryLoading viewMode={viewMode} />
      ) : inventoryError ? (
        <StatePanel
          className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
          message={(
            <div className="text-center">
              <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Failed to load inventory.</p>
              <button onClick={() => refetchInventory()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry</button>
            </div>
          )}
        />
      ) : products.length === 0 ? (
        <div className="py-20 text-center bg-[var(--color-sand)]/10 border-2 border-dashed border-[var(--color-stone)]/10 rounded-[2rem] sm:rounded-[4rem]">
          <Package size={64} className="mx-auto text-[var(--color-stone)]/20 mb-6" />
          <p className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">No Products Found</p>
          <p className="mt-2 text-[var(--color-text-muted)] italic">"Try adjusting your filters or add your first product."</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-12"
        >
          {viewMode === 'grid' ? (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="sync">
                {products.map((product) => (
                  <InventoryCard
                    key={product.id}
                    product={product}
                    editingStockId={editingStockId}
                    stockDraft={stockDrafts[product.id]}
                    onStartEditing={() => {
                      setEditingStockId(product.id);
                      setStockDrafts((current) => ({ ...current, [product.id]: String(product.stock ?? 0) }));
                    }}
                    onStockDraftChange={(value) =>
                      setStockDrafts((current) => ({ ...current, [product.id]: value }))
                    }
                    onCancelEditing={() => {
                      setEditingStockId(null);
                      setStockDrafts((current) => {
                        const next = { ...current };
                        delete next[product.id];
                        return next;
                      });
                    }}
                    onSaveStock={() => {
                      const nextStock = Number(stockDrafts[product.id]);
                      stockMutation.mutate({ id: product.id, stock: nextStock });
                    }}
                    isSaving={stockMutation.isPending && Number(stockMutation.variables?.id) === Number(product.id)}
                    onDelete={() => deleteMutation.mutate(product.id)}
                    isDeleting={deleteMutation.isPending && Number(deleteMutation.variables) === Number(product.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <InventoryTable
              products={products}
              editingStockId={editingStockId}
              stockDrafts={stockDrafts}
              onStartEditing={(product) => {
                setEditingStockId(product.id);
                setStockDrafts((current) => ({ ...current, [product.id]: String(product.stock ?? 0) }));
              }}
              onStockDraftChange={(productId, value) =>
                setStockDrafts((current) => ({ ...current, [productId]: value }))
              }
              onCancelEditing={(productId) => {
                setEditingStockId(null);
                setStockDrafts((current) => {
                  const next = { ...current };
                  delete next[productId];
                  return next;
                });
              }}
              onSaveStock={(productId) => {
                stockMutation.mutate({ id: productId, stock: Number(stockDrafts[productId]) });
              }}
              isSavingStock={(productId) =>
                stockMutation.isPending && Number(stockMutation.variables?.id) === Number(productId)
              }
              onDelete={(productId) => deleteMutation.mutate(productId)}
              isDeleting={(productId) =>
                deleteMutation.isPending && Number(deleteMutation.variables) === Number(productId)
              }
            />
          )}

          <div className="flex items-center justify-center gap-4 pt-12">
            <PaginationButton 
              disabled={filters.page === 1} 
              onClick={() => setFilters(c => ({ ...c, page: c.page - 1 }))}
              icon={<ChevronLeft size={20} />}
              label="Previous"
            />
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters(c => ({ ...c, page: i + 1 }))}
                  className={`w-12 h-12 rounded-2xl font-bold transition-all ${
                    filters.page === i + 1 
                      ? 'bg-[var(--color-primary-dark)] text-white shadow-xl scale-110' 
                      : 'bg-white border border-[var(--color-stone)]/10 text-[var(--color-text-muted)] hover:bg-[var(--color-sand)]/20'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <PaginationButton 
              disabled={filters.page === totalPages} 
              onClick={() => setFilters(c => ({ ...c, page: c.page + 1 }))}
              icon={<ChevronRight size={20} />}
              label="Next"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}

function InventoryCard({
  product,
  editingStockId,
  stockDraft,
  onStartEditing,
  onStockDraftChange,
  onCancelEditing,
  onSaveStock,
  isSaving,
  onDelete,
  isDeleting,
}) {
  const isEditing = Number(editingStockId) === Number(product.id);
  const stockValue = Number(product.stock || 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <SurfaceCard className="p-0 overflow-hidden bg-white border-[var(--color-stone)]/5 shadow-xl rounded-[3rem] group">
        <div className="aspect-[4/3] overflow-hidden relative">
          <SafeImage src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-1000 group-hover:scale-110" />
          <div className="absolute top-6 left-6">
            <StatusPill value={stockValue > 0 ? 'Active' : 'Cancelled'} />
          </div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <Link 
              to={`/product/${product.id}`}
              className="px-6 py-3 bg-white text-[var(--color-primary-dark)] rounded-xl font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all"
            >
              View Product <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h2 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] truncate">{product.name}</h2>
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1">Product ID: {String(product.id ?? '').slice(-8)}</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Price</div>
              <div className="text-xl font-bold text-[var(--color-primary-dark)]">{formatCurrency(product.price)}</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--color-sand)]/20 border border-[var(--color-stone)]/5 mb-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 text-[var(--color-primary-dark)] font-bold">
                <Package size={16} />
                <span className="text-sm">Stock: {stockValue}</span>
              </div>
              {!isEditing && (
                <button
                  onClick={onStartEditing}
                  className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest hover:underline"
                >
                  Update Stock
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-3">
                <input
                  type="number"
                  min="0"
                  value={stockDraft ?? ''}
                  onChange={(event) => onStockDraftChange(event.target.value)}
                  className="w-full h-12 rounded-xl border border-[var(--color-stone)]/10 bg-white px-4 text-[var(--color-primary-dark)] font-bold outline-none focus:border-[var(--color-accent)]/30 transition-all"
                />
                <div className="flex gap-2">
                  <button
                    onClick={onSaveStock}
                    disabled={isSaving}
                    className="flex-1 py-3 bg-[var(--color-primary-dark)] text-white rounded-xl font-bold text-xs disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Confirm'}
                  </button>
                  <button
                    onClick={onCancelEditing}
                    className="flex-1 py-3 border border-[var(--color-stone)]/10 text-[var(--color-primary-dark)] rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)] italic">
                {stockValue > 5 ? <CheckCircle2 size={14} className="text-[var(--color-primary)]" /> : stockValue > 0 ? <Clock size={14} className="text-amber-500" /> : <XCircle size={14} className="text-rose-500" />}
                {stockValue > 5 ? 'In Stock' : stockValue > 0 ? 'Low Stock' : 'Out of Stock'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-6 border-t border-[var(--color-stone)]/5">
            <Link
              to={`/seller/products/${product.id}/edit`}
              className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-sand)]/20 text-[var(--color-primary-dark)] font-bold text-sm hover:bg-[var(--color-accent)] hover:text-white transition-all shadow-sm"
            >
              <Pencil size={16} />
              Edit
            </Link>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all shadow-sm disabled:opacity-50"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </SurfaceCard>
    </motion.div>
  );
}

function InventoryTable({
  products,
  editingStockId,
  stockDrafts,
  onStartEditing,
  onStockDraftChange,
  onCancelEditing,
  onSaveStock,
  isSavingStock,
  onDelete,
  isDeleting,
}) {
  return (
    <SurfaceCard className="p-0 overflow-hidden bg-white border-[var(--color-stone)]/5 shadow-xl rounded-[3rem]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--color-sand)]/20 text-left">
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Product</th>
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Price</th>
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Stock</th>
              <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Status</th>
              <th className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-stone)]/5">
            {products.map((product) => {
              const isEditing = Number(editingStockId) === Number(product.id);
              return (
                <tr key={product.id} className="group hover:bg-[var(--color-sand)]/5 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[var(--color-sand)]/20 shrink-0">
                        <SafeImage src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--color-primary-dark)] truncate">{product.name}</p>
                        <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1">ID: {String(product.id).slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-bold text-[var(--color-primary-dark)]">{formatCurrency(product.price)}</td>
                  <td className="px-8 py-6">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={stockDrafts[product.id] ?? ''}
                          onChange={(e) => onStockDraftChange(product.id, e.target.value)}
                          className="w-20 h-10 rounded-lg border border-[var(--color-stone)]/10 px-3 font-bold text-sm outline-none"
                        />
                        <button onClick={() => onSaveStock(product.id)} className="p-2 bg-[var(--color-primary-dark)] text-white rounded-lg"><CheckCircle2 size={16} /></button>
                        <button onClick={() => onCancelEditing(product.id)} className="p-2 border border-[var(--color-stone)]/10 text-[var(--color-primary-dark)] rounded-lg"><XCircle size={16} /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => onStartEditing(product)}
                        className="flex items-center gap-2 font-bold text-[var(--color-primary-dark)] hover:text-[var(--color-accent)] transition-colors"
                      >
                        {product.stock} Units
                        <Pencil size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </td>
                  <td className="px-8 py-6"><StatusPill value={Number(product.stock) > 0 ? 'Active' : 'Cancelled'} /></td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/seller/products/${product.id}/edit`} className="w-10 h-10 rounded-xl bg-[var(--color-sand)]/20 flex items-center justify-center text-[var(--color-primary-dark)] hover:bg-[var(--color-accent)] hover:text-white transition-all"><Pencil size={16} /></Link>
                      <button onClick={() => onDelete(product.id)} className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 hover:bg-rose-100 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}

function ViewModeButton({ active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
        active 
          ? 'bg-white text-[var(--color-primary-dark)] shadow-sm' 
          : 'text-[var(--color-stone)]/60 hover:text-[var(--color-primary-dark)] hover:bg-white/50'
      }`}
    >
      {icon}
    </button>
  );
}

function PaginationButton({ disabled, onClick, icon, label }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-[var(--color-stone)]/10 text-[var(--color-primary-dark)] font-bold hover:bg-[var(--color-sand)]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm"
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function InventoryLoading({ viewMode }) {
  return (
    <div className={`grid gap-8 ${viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="h-96 rounded-[3rem] bg-[var(--color-sand)]/20 animate-pulse" />
      ))}
    </div>
  );
}

function resolveSort(sortBy) {
  return sortBy === 'price' ? 'price' : undefined;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}
