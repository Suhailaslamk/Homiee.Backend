import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Compass,
  LayoutGrid,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  Store,
  X,
  ChevronDown,
  Filter,
  Sparkles,
  Zap,
  ArrowUpRight,
  Info,
  Clock,
  CheckCircle2,
  Layers,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Heart,
  HeartOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategories, getProducts, getStores } from '../api/marketplace';
import { addToCart } from '../api/customer';
import * as WishlistAPI from '../api/wishlist';
const { addToWishlist, removeFromWishlist, getWishlist } = WishlistAPI;
import SafeImage from '../components/SafeImage';
import SurfaceCard from '../components/SurfaceCard';
import StatePanel from '../components/StatePanel';
import { getResponseData, getPagedItems, getPagedMeta } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/format';
import { isAuthenticated, isCustomerRole, getCurrentRole } from '../utils/auth';

export default function Discovery() {
  const [viewType, setViewType] = useState('products');
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [productFilters, setProductFilters] = useState({
    page: 1,
    pageSize: 12,
    search: '',
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest',
    desc: true,
    inStockOnly: false,
    minRating: '',
  });
  const [storeFilters, setStoreFilters] = useState({
    page: 1,
    pageSize: 9,
    search: '',
    categoryId: '',
    minRating: '',
    sortBy: 'rating',
    lat: null,
    lng: null,
    radiusKm: 10,
  });
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
  const [debouncedStoreSearch, setDebouncedStoreSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedProductSearch(productFilters.search.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [productFilters.search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedStoreSearch(storeFilters.search.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [storeFilters.search]);

  const { data: categoriesResponse } = useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 5,
  });

  const categories = (getResponseData(categoriesResponse) ?? []).filter(c => c.isActive !== false);

  // Sync view from path or URL
  useEffect(() => {
    if (location.pathname === '/stores') {
      setViewType('stores');
    }
  }, [location.pathname]);

  // Sync category from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryName = params.get('category');
    const viewParam = params.get('view');
    
    if (viewParam === 'stores') {
      setViewType('stores');
    }

    if (categoryName && categories.length > 0) {
      const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      if (category) {
        setProductFilters(prev => ({ ...prev, categoryId: category.id }));
        setViewType('products');
      }
    }
  }, [location.search, categories.length]);
  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  const productQuery = useMemo(
    () => ({
      page: productFilters.page,
      pageSize: productFilters.pageSize,
      search: debouncedProductSearch || undefined,
      categoryId: productFilters.categoryId || undefined,
      minPrice: productFilters.minPrice || undefined,
      maxPrice: productFilters.maxPrice || undefined,
      sortBy: resolveProductSort(productFilters.sortBy, productFilters.desc),
      desc: resolveProductDesc(productFilters.sortBy, productFilters.desc),
      inStockOnly: productFilters.inStockOnly || undefined,
      minRating: productFilters.minRating || undefined,
    }),
    [debouncedProductSearch, productFilters]
  );

  const storeQuery = useMemo(
    () => ({
      page: storeFilters.page,
      pageSize: storeFilters.pageSize,
      search: debouncedStoreSearch || undefined,
      categoryId: storeFilters.categoryId || undefined,
      minRating: storeFilters.minRating || undefined,
      sortBy: storeFilters.sortBy,
      lat: storeFilters.lat ?? undefined,
      lng: storeFilters.lng ?? undefined,
      radiusKm: storeFilters.lat && storeFilters.lng ? storeFilters.radiusKm : undefined,
    }),
    [debouncedStoreSearch, storeFilters]
  );

  const { data: productsData, isLoading: productsLoading, isFetching: productsFetching, error: productsError, refetch: refetchProducts } = useQuery({
    queryKey: ['marketplace-products', productQuery],
    queryFn: () => getProducts(productQuery),
    enabled: viewType === 'products',
    placeholderData: keepPreviousData,
  });

  const { data: storesData, isLoading: storesLoading, isFetching: storesFetching, error: storesError, refetch: refetchStores } = useQuery({
    queryKey: ['marketplace-stores', storeQuery],
    queryFn: () => getStores(storeQuery),
    enabled: viewType === 'stores',
    placeholderData: keepPreviousData,
  });

  const products = getPagedItems(productsData);
  const productsMeta = getPagedMeta(productsData);
  const stores = getPagedItems(storesData);
  const storesMeta = getPagedMeta(storesData);
  
  const productPages = getPageNumbers(productsMeta.page, productsMeta.totalPages);
  const storePages = getPageNumbers(storesMeta.page, storesMeta.totalPages);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStoreFilters((current) => ({
          ...current,
          page: 1,
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        }));
        setIsLocating(false);
        toast.success('Location added. Stores refined by proximity.');
      },
      (error) => {
        setIsLocating(false);
        toast.error('Unable to access location.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearLocation = () => {
    setStoreFilters((current) => ({ ...current, page: 1, lat: null, lng: null }));
    toast.info('Location parameters cleared.');
  };

  return (
    <div className="min-h-screen bg-[var(--color-sand)]/10 pb-24 pt-32 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Gallery Hero */}
        <header className="mb-20">
          <div className="max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white border border-[var(--color-stone)]/5 shadow-sm text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-primary)] mb-8"
            >
              <Compass size={14} className="text-[var(--color-accent)]" />
              Artisan Curation Engine Active
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl sm:text-7xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tighter leading-[1.05]"
            >
              Discover the <i className="text-[var(--color-accent)]">Soul</i> of independent craft.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 text-xl text-[var(--color-text-muted)] font-medium max-w-2xl italic leading-relaxed"
            >
              "A hand-vetted collection of artisanal treasures and independent studios, curated for the modern collector."
            </motion.p>
          </div>

          <div className="mt-16 flex flex-col xl:flex-row items-center justify-between gap-10">
            {/* View Orchestrator */}
            <div className="relative flex p-2 bg-white/50 backdrop-blur-xl rounded-[2rem] border border-white shadow-xl w-full xl:w-auto">
              <div className="absolute inset-2 flex pointer-events-none">
                <motion.div 
                  className="bg-[var(--color-primary-dark)] shadow-2xl rounded-[1.5rem] h-full"
                  initial={false}
                  animate={{ x: viewType === 'products' ? '0%' : '100%', width: '50%' }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>
              
              <button
                onClick={() => setViewType('products')}
                className={`relative z-10 flex-1 xl:flex-none flex items-center justify-center gap-4 px-10 py-5 text-sm font-bold transition-all ${
                  viewType === 'products' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'
                }`}
              >
                <Layers size={18} /> Products
              </button>
              <button
                onClick={() => setViewType('stores')}
                className={`relative z-10 flex-1 xl:flex-none flex items-center justify-center gap-4 px-10 py-5 text-sm font-bold transition-all ${
                  viewType === 'stores' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'
                }`}
              >
                <Store size={18} /> Studios
              </button>
            </div>

            {/* Global Search */}
            <div className="relative w-full max-w-2xl group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-stone)]/40 group-focus-within:text-[var(--color-accent)] transition-colors" size={24} />
              <input
                type="text"
                placeholder={viewType === 'products' ? "Search for an artisanal piece..." : "Identify a studio..."}
                value={viewType === 'products' ? productFilters.search : storeFilters.search}
                onChange={(e) => {
                  const val = e.target.value;
                  if (viewType === 'products') setProductFilters(prev => ({ ...prev, search: val, page: 1 }));
                  else setStoreFilters(prev => ({ ...prev, search: val, page: 1 }));
                }}
                className="w-full pl-16 pr-8 py-6 bg-white border border-[var(--color-stone)]/5 rounded-[2.5rem] shadow-2xl focus:ring-8 focus:ring-[var(--color-accent)]/5 focus:border-[var(--color-accent)]/20 outline-none transition-all font-medium text-lg text-[var(--color-primary-dark)] placeholder:text-[var(--color-stone)]/30"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Realtime</span>
              </div>
            </div>
          </div>
        </header>

        {/* Gallery Content */}
        <div className="space-y-20">
          {viewType === 'products' ? (
            <div className="grid gap-12 lg:grid-cols-[1fr]">
              {/* Product Controls */}
              <div className="space-y-12">
                <ProductFilters filters={productFilters} setFilters={setProductFilters} categories={categories} />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-8 border-t border-[var(--color-stone)]/5">
                  <div>
                    <h2 className="text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">
                      {productsMeta?.totalCount ?? 0} <i className="text-[var(--color-accent)]">Exhibits</i>
                    </h2>
                    <p className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2 italic">Refined collection by your chosen parameters</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Orchestration</span>
                    <select
                      value={productFilters.sortBy}
                      onChange={(e) => setProductFilters(prev => ({ ...prev, page: 1, sortBy: e.target.value }))}
                      className="bg-white border border-[var(--color-stone)]/5 rounded-2xl px-6 py-4 text-sm font-bold text-[var(--color-primary-dark)] outline-none focus:border-[var(--color-accent)]/20 transition-all cursor-pointer shadow-sm"
                    >
                      <option value="newest">Genesis Order (Newest)</option>
                      <option value="price_asc">Valuation: Minimum</option>
                      <option value="price_desc">Valuation: Maximum</option>
                      <option value="rating">Collector Choice (Rating)</option>
                    </select>
                  </div>
                </div>

                {productsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-[3/4] bg-[var(--color-sand)]/20 rounded-[3rem] animate-pulse" />)}
                  </div>
                ) : productsError ? (
                  <StatePanel 
                    className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
                    message={(
                      <div className="text-center">
                        <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Transmission Error in Gallery Sync</p>
                        <button onClick={refetchProducts} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry Synchronization</button>
                      </div>
                    )}
                  />
                ) : products.length === 0 ? (
                  <div className="py-24 text-center bg-white border border-[var(--color-stone)]/5 rounded-[4rem] shadow-xl">
                    <Sparkles size={64} className="mx-auto text-[var(--color-stone)]/20 mb-8" />
                    <h3 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Gallery Quiescent</h3>
                    <p className="mt-4 text-[var(--color-text-muted)] italic max-w-sm mx-auto leading-relaxed">"No exhibits were found matching your current refinement parameters. Broaden your search."</p>
                  </div>
                ) : (
                  <div className="space-y-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                      {products.map((product, idx) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <ProductExhibit 
                            product={product} 
                            categoryName={categoryMap[product.categoryId]} 
                            onClick={() => navigate(`/product/${product.id}`)}
                          />
                        </motion.div>
                      ))}
                    </div>

                    <Pagination
                      currentPage={productsMeta.page}
                      totalPages={productsMeta.totalPages}
                      pages={productPages}
                      onPageChange={(page) => setProductFilters((current) => ({ ...current, page }))}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              <StoreFilters
                filters={storeFilters}
                setFilters={setStoreFilters}
                categories={categories}
                onUseLocation={handleUseLocation}
                onClearLocation={clearLocation}
                isLocating={isLocating}
              />

              {storesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-96 bg-[var(--color-sand)]/20 rounded-[3rem] animate-pulse" />)}
                </div>
              ) : stores.length === 0 ? (
                <div className="py-24 text-center bg-white border border-[var(--color-stone)]/5 rounded-[4rem] shadow-xl">
                  <Store size={64} className="mx-auto text-[var(--color-stone)]/20 mb-8" />
                  <h3 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Studios Unidentified</h3>
                  <p className="mt-4 text-[var(--color-text-muted)] italic max-w-sm mx-auto leading-relaxed">"No artisan studios matched your current registry filters."</p>
                </div>
              ) : (
                <div className="space-y-16">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {stores.map((store, idx) => (
                      <motion.div
                        key={store.sellerId}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <StorePortfolio 
                          store={store} 
                          onClick={() => navigate(`/store/${store.sellerId}`)} 
                        />
                      </motion.div>
                    ))}
                  </div>

                  <Pagination
                    currentPage={storesMeta.page}
                    totalPages={storesMeta.totalPages}
                    pages={storePages}
                    onPageChange={(page) => setStoreFilters((current) => ({ ...current, page }))}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductFilters({ filters, setFilters, categories }) {
  return (
    <div className="bg-white/40 backdrop-blur-md border border-white p-10 rounded-[4rem] shadow-2xl space-y-12">
      {/* Category Ribbon */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-primary-dark)]">Registry Categories</h3>
          {filters.categoryId && (
            <button 
              onClick={() => setFilters(prev => ({ ...prev, categoryId: '', page: 1 }))}
              className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          <button
            onClick={() => setFilters(prev => ({ ...prev, categoryId: '', page: 1 }))}
            className={`whitespace-nowrap px-8 py-3 rounded-full text-xs font-bold transition-all border-2 ${
              !filters.categoryId 
                ? 'bg-[var(--color-primary-dark)] text-white border-transparent shadow-xl' 
                : 'bg-white text-[var(--color-text-muted)] border-[var(--color-stone)]/5 hover:border-[var(--color-primary-dark)]/20'
            }`}
          >
            All Exhibits
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilters(prev => ({ ...prev, categoryId: cat.id, page: 1 }))}
              className={`whitespace-nowrap px-8 py-3 rounded-full text-xs font-bold transition-all border-2 flex items-center gap-2 ${
                filters.categoryId === cat.id 
                  ? 'bg-[var(--color-primary-dark)] text-[var(--color-accent)] border-transparent shadow-xl scale-105' 
                  : 'bg-white text-[var(--color-text-muted)] border-[var(--color-stone)]/5 hover:border-[var(--color-primary-dark)]/20'
              }`}
            >
              {filters.categoryId === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 items-end">
        {/* Price Curation */}
        <div className="space-y-5">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
            <span>Valuation Ledger</span>
            <span className="text-[var(--color-accent)] font-black">₹{filters.minPrice || 0} — ₹{filters.maxPrice || '∞'}</span>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <div className="relative flex-1 h-1.5 bg-[var(--color-sand)] rounded-full">
              <input
                type="range" min="0" max="25000" step="500"
                value={filters.minPrice || 0}
                onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value, page: 1 }))}
                className="absolute inset-0 w-full appearance-none bg-transparent accent-[var(--color-accent)] cursor-pointer"
              />
              <input
                type="range" min="0" max="25000" step="500"
                value={filters.maxPrice || 25000}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value, page: 1 }))}
                className="absolute inset-0 w-full appearance-none bg-transparent accent-[var(--color-accent)] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Rating Tiers */}
        <div className="space-y-5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Observation Quality</label>
          <div className="flex gap-3">
            {[4, 3].map(rating => (
              <button
                key={rating}
                onClick={() => setFilters(prev => ({ ...prev, minRating: prev.minRating === rating ? '' : rating, page: 1 }))}
                className={`flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2 ${
                  filters.minRating === rating
                    ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)] border-transparent shadow-lg'
                    : 'bg-white text-[var(--color-text-muted)] border-[var(--color-stone)]/5 hover:border-[var(--color-accent)]/30'
                }`}
              >
                {rating}★ Plus
              </button>
            ))}
          </div>
        </div>

        {/* Stock Protocol */}
        <div className="flex items-center justify-between h-12 px-6 bg-white border border-[var(--color-stone)]/5 rounded-2xl">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Allocation Ready</span>
          <button
            onClick={() => setFilters(prev => ({ ...prev, inStockOnly: !prev.inStockOnly, page: 1 }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${filters.inStockOnly ? 'bg-emerald-500' : 'bg-[var(--color-sand)]'}`}
          >
            <motion.div animate={{ x: filters.inStockOnly ? 22 : 2 }} className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm" />
          </button>
        </div>

        {/* Global Reset */}
        <button
          onClick={() => setFilters({
            page: 1, pageSize: 12, search: '', categoryId: '', minPrice: '', maxPrice: '',
            sortBy: 'newest', desc: true, inStockOnly: false, minRating: ''
          })}
          className="h-12 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-muted)] hover:text-rose-500 transition-colors"
        >
          <X size={14} /> Void Parameters
        </button>
      </div>
    </div>
  );
}

function StoreFilters({ filters, setFilters, categories, onUseLocation, onClearLocation, isLocating }) {
  return (
    <div className="bg-white/40 backdrop-blur-md border border-white p-10 rounded-[4rem] shadow-2xl space-y-12">
      <div className="space-y-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-primary-dark)]">Studio Specialization</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          <button
            onClick={() => setFilters(prev => ({ ...prev, categoryId: '', page: 1 }))}
            className={`whitespace-nowrap px-8 py-3 rounded-full text-xs font-bold transition-all border-2 ${
              !filters.categoryId ? 'bg-[var(--color-primary-dark)] text-white' : 'bg-white text-[var(--color-text-muted)] border-[var(--color-stone)]/5'
            }`}
          >
            All Collectives
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilters(prev => ({ ...prev, categoryId: cat.id, page: 1 }))}
              className={`whitespace-nowrap px-8 py-3 rounded-full text-xs font-bold transition-all border-2 ${
                filters.categoryId === cat.id ? 'bg-[var(--color-primary-dark)] text-white' : 'bg-white text-[var(--color-text-muted)] border-[var(--color-stone)]/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row items-center gap-10">
        <div className="flex items-center gap-6 bg-white border border-[var(--color-stone)]/5 px-8 py-5 rounded-[2rem] shadow-xl w-full xl:w-auto">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${filters.lat ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)]' : 'bg-[var(--color-sand)] text-[var(--color-stone)]'}`}>
            <MapPin size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[var(--color-primary-dark)]">Proximity Search</p>
            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-0.5">Find independent studios nearby</p>
          </div>
          <button
            onClick={filters.lat ? onClearLocation : onUseLocation}
            disabled={isLocating}
            className={`relative w-12 h-6 rounded-full transition-colors ${filters.lat ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-sand)]'}`}
          >
            <motion.div animate={{ x: filters.lat ? 26 : 2 }} className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm" />
          </button>
        </div>

        <AnimatePresence>
          {filters.lat && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="flex-1 w-full space-y-3"
            >
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] pr-2">
                <span>Signal Radius</span>
                <span className="text-[var(--color-accent)]">{filters.radiusKm} Kilometers</span>
              </div>
              <input
                type="range" min="5" max="100" step="5"
                value={filters.radiusKm}
                onChange={(e) => setFilters(prev => ({ ...prev, radiusKm: Number(e.target.value), page: 1 }))}
                className="w-full h-1.5 bg-[var(--color-sand)] rounded-full appearance-none accent-[var(--color-accent)] cursor-pointer"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProductExhibit({ product, categoryName, onClick }) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const cartMutation = useMutation({
    mutationFn: (payload) => addToCart(payload),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['cart'] }); 
      toast.success('Exhibit captured in bag.'); 
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to capture exhibit.');
    }
  });

  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled: isAuthenticated(),
  });

  const wishlist = getResponseData(wishlistData) || [];
  const isInWishlist = wishlist.some(item => item.productId === product.id);

  const wishlistMutation = useMutation({
    mutationFn: () => isInWishlist ? removeFromWishlist(product.id) : addToWishlist(product.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(isInWishlist ? 'Removed from your curations.' : 'Added to your curations.');
    },
  });

  return (
    <SurfaceCard 
      onClick={onClick}
      className="bg-white border-[var(--color-stone)]/5 p-0 overflow-hidden shadow-xl rounded-[3.5rem] group transition-all hover:shadow-2xl hover:border-[var(--color-accent)]/10"
    >
      <div className="aspect-[4/5] overflow-hidden relative">
        <SafeImage src={product.images?.[0] || product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isAuthenticated()) {
                toast.info('Please log in to capture this exhibit in your bag.');
                navigate('/login');
                return;
              }
              cartMutation.mutate({ productId: product.id, quantity: 1 }); 
            }}
            className="w-full py-5 bg-[var(--color-accent)] text-[var(--color-primary-dark)] font-bold rounded-2xl flex items-center justify-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500"
          >
            <ShoppingBag size={20} /> Quick Acquisition
          </button>
        </div>
        <div className="absolute top-6 left-6 flex gap-3">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isAuthenticated()) {
                toast.info('Please log in to add this to your curations.');
                navigate('/login');
                return;
              }
              wishlistMutation.mutate(); 
            }}
            className={`w-10 h-10 rounded-xl backdrop-blur-md flex items-center justify-center transition-all shadow-xl ${isInWishlist ? 'bg-rose-500 text-white' : 'bg-white/90 text-[var(--color-primary-dark)] hover:bg-rose-50'}`}
          >
            <Heart size={18} className={isInWishlist ? 'fill-current' : ''} />
          </button>
        </div>
        <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black text-[var(--color-primary-dark)] shadow-xl">
          {formatCurrency(product.price)}
        </div>
      </div>
      <div className="p-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
          <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">{categoryName || 'Artisanal'}</span>
        </div>
        <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent)] transition-colors leading-tight truncate">{product.name}</h3>
        <div className="mt-6 flex items-center justify-between pt-6 border-t border-[var(--color-stone)]/5">
          <div className="flex items-center gap-1 text-[var(--color-accent)] font-bold text-sm">
            <Star size={14} className="fill-current" />
            {Number(product.averageRating || 0).toFixed(1)}
          </div>
          <div className="text-[10px] font-black text-[var(--color-primary-dark)] uppercase tracking-widest flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Examine <ArrowUpRight size={14} />
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

function StorePortfolio({ store, onClick }) {
  return (
    <SurfaceCard 
      onClick={onClick}
      className="bg-white border-[var(--color-stone)]/5 p-0 overflow-hidden shadow-xl rounded-[3.5rem] group transition-all hover:shadow-2xl hover:border-[var(--color-accent)]/10"
    >
      <div className="h-32 bg-[var(--color-sand)]/30 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-accent),transparent_70%)] opacity-20" />
        {store.distanceKm && (
          <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black text-[var(--color-primary-dark)] shadow-xl">
            {store.distanceKm} km Proximity
          </div>
        )}
      </div>
      <div className="px-8 pb-10 relative">
        <div className="absolute -top-12 left-8">
          <div className="w-24 h-24 rounded-[2rem] bg-[var(--color-primary-dark)] text-[var(--color-accent)] flex items-center justify-center text-4xl font-['Fraunces'] font-bold shadow-2xl ring-8 ring-white transition-transform group-hover:scale-105">
            {getInitials(store.businessName)}
          </div>
        </div>
        <div className="pt-16">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent)] transition-colors">{store.businessName}</h3>
            <div className="flex items-center gap-1.5 text-[var(--color-accent)] font-bold text-lg">
              <Star size={18} className="fill-current" />
              {Number(store.averageRating || 0).toFixed(1)}
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--color-text-muted)] font-medium italic truncate">{store.address || 'Independent Artisan Hub'}</p>
          <div className="mt-8 flex items-center justify-between pt-8 border-t border-[var(--color-stone)]/5">
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--color-primary-dark)]">{store.productCount || 0}</p>
                <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Exhibits</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--color-primary-dark)]">{store.reviewCount || 0}</p>
                <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Signals</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)] opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-xl">
              <ArrowUpRight size={24} />
            </div>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

function Pagination({ currentPage, totalPages, pages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 pt-12">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-14 h-14 rounded-2xl bg-white border border-[var(--color-stone)]/5 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 transition-all hover:bg-[var(--color-sand)]/20 shadow-sm"
      >
        <ChevronLeft size={24} />
      </button>
      <div className="flex items-center gap-2">
        {pages.map((p, i) => (
          p === '...' ? <span key={`sep-${i}`} className="text-[var(--color-stone)]">...</span> : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-12 h-12 rounded-2xl font-bold transition-all ${
                currentPage === p ? 'bg-[var(--color-primary-dark)] text-white shadow-xl' : 'bg-white text-[var(--color-text-muted)] border border-[var(--color-stone)]/5'
              }`}
            >
              {p}
            </button>
          )
        ))}
      </div>
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-14 h-14 rounded-2xl bg-white border border-[var(--color-stone)]/5 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 transition-all hover:bg-[var(--color-sand)]/20 shadow-sm"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
}

function resolveProductSort(sortBy, desc) {
  if (sortBy === 'newest') return 'newest';
  if (sortBy === 'price_asc') return 'price';
  if (sortBy === 'price_desc') return 'price';
  if (sortBy === 'rating') return 'rating';
  return sortBy;
}

function resolveProductDesc(sortBy, desc) {
  if (sortBy === 'price_asc') return false;
  if (sortBy === 'price_desc') return true;
  return true;
}

function getPageNumbers(current, total) {
  const pages = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 3) pages.push(1, 2, 3, 4, '...', total);
    else if (current >= total - 2) pages.push(1, '...', total - 3, total - 2, total - 1, total);
    else pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
}



function getInitials(value = '') {
  return value.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S';
}
