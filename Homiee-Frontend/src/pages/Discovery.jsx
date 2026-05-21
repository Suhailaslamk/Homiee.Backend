import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  MapPin,
  RefreshCw,
  Search,
  Star,
  Store,
  X,
  Sparkles,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Heart,
  ChevronDown,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategories, getProducts, getStores } from '../api/marketplace';
import { addToCart } from '../api/customer';
import * as WishlistAPI from '../api/wishlist';
const { addToWishlist, removeFromWishlist, getWishlist } = WishlistAPI;
import SafeImage from '../components/SafeImage';
import StatePanel from '../components/StatePanel';
import { getResponseData, getPagedItems, getPagedMeta } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/format';
import { isAuthenticated } from '../utils/auth';
import CartDrawer from '../components/CartDrawer';

const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 — ₹2,000', min: 500, max: 2000 },
  { label: '₹2,000 — ₹5,000', min: 2000, max: 5000 },
  { label: '₹5,000+', min: 5000, max: 100000 },
];

export default function Discovery() {
  const [viewType, setViewType] = useState('products');
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  const { data: productsData, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery({
    queryKey: ['marketplace-products', productQuery],
    queryFn: () => getProducts(productQuery),
    enabled: viewType === 'products',
    placeholderData: keepPreviousData,
  });

  const { data: storesData, isLoading: storesLoading, error: storesError, refetch: refetchStores } = useQuery({
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
        toast.success('Location updated. Showing nearby shops.');
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
    toast.info('Location filters cleared.');
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24 pt-32 px-6 paper-texture">
      <div className="mx-auto max-w-[1400px]">
        {/* Breadcrumbs */}
        <div className="mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-stone)]/60">
          <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[var(--color-primary-dark)]">Marketplace</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 pb-12 border-b border-[var(--color-stone)]/10">
          <div className="max-w-2xl">
            <h1 className="text-5xl sm:text-7xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tight">
              Curated <i className="font-light italic text-[var(--color-accent)]">Provisions</i>
            </h1>
            <p className="mt-6 text-lg text-[var(--color-text-muted)] font-medium leading-relaxed italic">
              "Artisanal delicacies and unique creations sourced from local independent sellers, 
              prepared with patience and reverence for heritage flavors."
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
             {/* View Switcher */}
             <div className="flex bg-[var(--color-sand)]/20 p-1">
              <button
                onClick={() => setViewType('products')}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewType === 'products' ? 'bg-white text-[var(--color-primary-dark)] shadow-sm' : 'text-[var(--color-stone)]/50 hover:text-[var(--color-primary)]'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setViewType('stores')}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewType === 'stores' ? 'bg-white text-[var(--color-primary-dark)] shadow-sm' : 'text-[var(--color-stone)]/50 hover:text-[var(--color-primary)]'
                }`}
              >
                Stores
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative group w-full sm:w-64">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]/40 pointer-events-none">
                <span className="text-[10px] font-black uppercase tracking-widest">Sort:</span>
              </div>
              <select
                value={viewType === 'products' ? productFilters.sortBy : storeFilters.sortBy}
                onChange={(e) => {
                  const val = e.target.value;
                  if (viewType === 'products') setProductFilters(prev => ({ ...prev, page: 1, sortBy: val }));
                  else setStoreFilters(prev => ({ ...prev, page: 1, sortBy: val }));
                }}
                className="w-full pl-16 pr-4 py-3.5 bg-white border border-[var(--color-stone)]/10 text-xs font-bold text-[var(--color-primary-dark)] outline-none focus:border-[var(--color-accent)]/30 transition-all cursor-pointer appearance-none shadow-sm"
              >
                {viewType === 'products' ? (
                  <>
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </>
                ) : (
                  <>
                    <option value="rating">Top Rated</option>
                    <option value="newest">Newest First</option>
                  </>
                )}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]/40 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 sm:gap-16 items-start">
          
          {/* Mobile Filter Toggle */}
          <button 
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="lg:hidden flex items-center justify-center gap-3 w-full py-4 bg-[var(--color-primary-dark)] text-white font-bold text-sm shadow-xl"
          >
            <Filter size={18} /> {showMobileSidebar ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Sidebar */}
          <aside className={`${showMobileSidebar ? 'block' : 'hidden'} lg:block space-y-12`}>
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-stone)]/30 group-focus-within:text-[var(--color-accent)] transition-colors" size={18} />
              <input
                type="text"
                placeholder={viewType === 'products' ? "Search products..." : "Search stores..."}
                value={viewType === 'products' ? productFilters.search : storeFilters.search}
                onChange={(e) => {
                  const val = e.target.value;
                  if (viewType === 'products') setProductFilters(prev => ({ ...prev, search: val, page: 1 }));
                  else setStoreFilters(prev => ({ ...prev, search: val, page: 1 }));
                }}
                className="w-full pl-12 pr-4 py-4 bg-white border border-[var(--color-stone)]/10 outline-none focus:border-[var(--color-accent)]/30 transition-all font-bold text-sm text-[var(--color-primary-dark)] placeholder:text-[var(--color-stone)]/30 shadow-inner"
              />
            </div>

            {/* Categories */}
            <section className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-primary-dark)] pb-4 border-b border-[var(--color-stone)]/10">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    if (viewType === 'products') setProductFilters(prev => ({ ...prev, categoryId: '', page: 1 }));
                    else setStoreFilters(prev => ({ ...prev, categoryId: '', page: 1 }));
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-all ${
                    !(viewType === 'products' ? productFilters.categoryId : storeFilters.categoryId) 
                      ? 'bg-[var(--color-primary-dark)] text-white shadow-lg' 
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-sand)]/20'
                  }`}
                >
                  <span>All Provisions</span>
                  <span className="text-[10px] opacity-40">{productsMeta.totalCount || 0}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (viewType === 'products') setProductFilters(prev => ({ ...prev, categoryId: cat.id, page: 1 }));
                      else setStoreFilters(prev => ({ ...prev, categoryId: cat.id, page: 1 }));
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-all ${
                      (viewType === 'products' ? productFilters.categoryId : storeFilters.categoryId) === cat.id
                        ? 'bg-[var(--color-primary-dark)] text-white shadow-lg' 
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-sand)]/20'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Price Range */}
            {viewType === 'products' && (
              <section className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-primary-dark)] pb-4 border-b border-[var(--color-stone)]/10">Price Range</h3>
                <div className="space-y-4 px-2">
                  {PRICE_RANGES.map((range) => {
                    const isSelected = productFilters.minPrice === String(range.min) && productFilters.maxPrice === String(range.max);
                    return (
                      <label key={range.label} className="flex items-center gap-3 cursor-pointer group">
                        <div 
                          onClick={() => setProductFilters(prev => ({
                            ...prev, 
                            page: 1, 
                            minPrice: isSelected ? '' : String(range.min),
                            maxPrice: isSelected ? '' : String(range.max)
                          }))}
                          className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${isSelected ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--color-stone)]/20 group-hover:border-[var(--color-primary)]/40'}`}
                        >
                          {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                        </div>
                        <span className={`text-sm font-bold transition-colors ${isSelected ? 'text-[var(--color-primary-dark)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-primary-dark)]'}`}>
                          {range.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            )}

             {/* In Stock Toggle */}
             {viewType === 'products' && (
               <section className="space-y-6">
                 <div className="flex items-center justify-between pt-6 border-t border-[var(--color-stone)]/10">
                   <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-primary-dark)]">Show In-Stock Only</span>
                   <button
                    onClick={() => setProductFilters(prev => ({ ...prev, inStockOnly: !prev.inStockOnly, page: 1 }))}
                    className={`relative w-12 h-6 transition-colors ${productFilters.inStockOnly ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-stone)]/20'}`}
                   >
                    <motion.div 
                      animate={{ x: productFilters.inStockOnly ? 28 : 4 }} 
                      className="absolute top-1 left-0 w-4 h-4 bg-white shadow-md" 
                    />
                   </button>
                 </div>
               </section>
             )}

             {/* Global Reset */}
             <button
              onClick={() => {
                setProductFilters({
                  page: 1, pageSize: 12, search: '', categoryId: '', minPrice: '', maxPrice: '',
                  sortBy: 'newest', desc: true, inStockOnly: false, minRating: ''
                });
                setStoreFilters({
                  page: 1, pageSize: 9, search: '', categoryId: '', minRating: '',
                  sortBy: 'rating', lat: null, lng: null, radiusKm: 10
                });
              }}
              className="w-full py-4 border border-[var(--color-stone)]/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--color-stone)] hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50/30 transition-all flex items-center justify-center gap-2"
             >
               <RefreshCw size={14} /> Reset All Refinements
             </button>
          </aside>

          <main className="min-w-0 space-y-12 sm:space-y-16">
            {viewType === 'products' ? (
              <>
                {productsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <div key={i} className="aspect-square bg-[var(--color-sand)]/20 rounded-[1.5rem] animate-pulse" />)}
                  </div>
                ) : productsError ? (
                  <StatePanel 
                    className="bg-white border border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
                    message={(
                      <div className="text-center">
                        <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-6">Failed to load curated collection.</p>
                        <button onClick={() => refetchProducts()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all">Retry Discovering</button>
                      </div>
                    )}
                  />
                ) : products.length === 0 ? (
                  <div className="py-24 text-center bg-white border border-[var(--color-stone)]/5 rounded-[4rem] shadow-sm">
                    <Sparkles size={48} className="mx-auto text-[var(--color-stone)]/20 mb-8" />
                    <h3 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">No matching provisions</h3>
                    <p className="mt-4 text-[var(--color-text-muted)] italic max-w-sm mx-auto leading-relaxed">"Perhaps adjust your refinements to discover other heritage flavors."</p>
                  </div>
                ) : (
                  <div className="space-y-16">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 sm:gap-x-10 sm:gap-y-14">
                      {products.map((product, idx) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 15 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: (idx % 5) * 0.05 }}
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
              </>
            ) : (
              /* Stores View */
              <div className="space-y-12 sm:space-y-16">
                <section className="bg-[var(--color-sand)]/10 border border-[var(--color-stone)]/10 p-8 rounded-[3rem] flex flex-col sm:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md ${storeFilters.lat ? 'bg-[var(--color-primary-dark)] text-white' : 'bg-white text-[var(--color-stone)]'}`}>
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[var(--color-primary-dark)]">Nearby Artisans</h4>
                      <p className="text-xs text-[var(--color-text-muted)] font-medium">Discover independent sellers in your heritage circle.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/50 p-2 rounded-2xl border border-white/40">
                    {storeFilters.lat && (
                      <div className="px-4 text-xs font-black uppercase tracking-widest text-[var(--color-primary)]">
                        {storeFilters.radiusKm} km
                      </div>
                    )}
                    <button
                      onClick={storeFilters.lat ? clearLocation : handleUseLocation}
                      disabled={isLocating}
                      className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm transition-all ${
                        storeFilters.lat ? 'bg-rose-50 text-rose-600' : 'bg-[var(--color-primary-dark)] text-white hover:brightness-110'
                      }`}
                    >
                      {isLocating ? 'Locating...' : storeFilters.lat ? 'Clear Radius' : 'Enable Location'}
                    </button>
                  </div>
                </section>

                {storesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-80 bg-[var(--color-sand)]/20 rounded-[2.5rem] animate-pulse" />)}
                  </div>
                ) : stores.length === 0 ? (
                  <div className="py-24 text-center bg-white border border-[var(--color-stone)]/5 rounded-[4rem] shadow-sm">
                    <Store size={48} className="mx-auto text-[var(--color-stone)]/20 mb-8" />
                    <h3 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">No artisans found</h3>
                    <p className="mt-4 text-[var(--color-text-muted)] italic max-w-sm mx-auto leading-relaxed">Try expanding your search radius or category.</p>
                  </div>
                ) : (
                  <div className="space-y-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                      {stores.map((store, idx) => (
                        <motion.div
                          key={store.sellerId}
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: (idx % 3) * 0.1 }}
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
          </main>
        </div>
      </div>

      {/* Floating Cart Trigger */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-32 right-8 z-[90] w-16 h-16 rounded-full bg-[var(--color-primary-dark)] text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <ShoppingBag size={24} className="group-hover:rotate-12 transition-transform" />
        {productsMeta.totalCount > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center ring-4 ring-[var(--color-background)]">
            {productsMeta.totalCount}
          </div>
        )}
      </button>

      {/* Premium Selection Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}

function ProductExhibit({ product, categoryName, onClick }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const cartMutation = useMutation({
    mutationFn: (payload) => addToCart(payload),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['cart'] }); 
      toast.success('Provision added to selection.'); 
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update selection.');
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
      toast.success(isInWishlist ? 'Removed from saved.' : 'Saved to favorites.');
    },
  });

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="aspect-square overflow-hidden relative bg-[var(--color-sand)]/10 border border-[var(--color-stone)]/5 shadow-sm transition-all duration-700 group-hover:shadow-xl group-hover:border-[var(--color-accent)]/20">
        <SafeImage 
          src={typeof (product.images?.[0]) === 'string' ? product.images[0] : (product.images?.[0]?.url || product.images?.[0]?.imageUrl || product.imageUrl)} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
        />
        
        {/* Overlay Badges */}
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isAuthenticated()) {
                toast.info('Sign in to save provisions.');
                navigate('/login');
                return;
              }
              wishlistMutation.mutate(); 
            }}
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-500 transform group-hover:scale-110 ${isInWishlist ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20' : 'bg-white/80 text-[var(--color-primary-dark)] hover:bg-white shadow-sm hover:shadow-md'}`}
          >
            <Heart size={16} className={isInWishlist ? 'fill-current' : ''} />
          </button>
        </div>

        {/* Action Overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-[1px] flex items-end p-4">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isAuthenticated()) {
                toast.info('Sign in to manage selection.');
                navigate('/login');
                return;
              }
              cartMutation.mutate({ productId: product.id, quantity: 1 }); 
            }}
            className="w-full py-3 bg-white text-[var(--color-primary-dark)] text-[9px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-2xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-500 hover:bg-[var(--color-accent)] hover:text-white"
          >
            <ShoppingBag size={12} /> Add to Selection
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pt-5 px-1 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm sm:text-base font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight group-hover:text-[var(--color-accent)] transition-colors flex-1 line-clamp-2">
            {product.name}
          </h3>
          <span className="text-sm sm:text-base font-['Fraunces'] font-medium text-[var(--color-primary-dark)] pt-0.5">
            {formatCurrency(product.price)}
          </span>
        </div>
        
        <div className="flex items-center gap-3 mt-1 mb-3">
          <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-stone)]/60 bg-[var(--color-sand)]/20 px-2 py-0.5 rounded-full">
            {categoryName || 'General'}
          </span>
          <div className="flex items-center gap-1 text-[var(--color-accent)] font-bold text-[10px]">
            <Star size={10} className="fill-current" />
            {Number(product.averageRating || 0).toFixed(1)}
          </div>
        </div>

        <p className="text-[10px] text-[var(--color-text-muted)] font-medium leading-relaxed italic line-clamp-2 mt-auto opacity-70">
          {product.description || "A masterfully crafted provision reflecting heritage and flavor."}
        </p>
      </div>
    </div>
  );
}

function StorePortfolio({ store, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="classic-card p-10 relative overflow-hidden group cursor-pointer border-none shadow-none bg-white/50 backdrop-blur-sm ring-1 ring-[var(--color-stone)]/5 hover:ring-[var(--color-accent)]/20 transition-all duration-500"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-8">
          <div className="w-16 h-16 bg-[var(--color-primary-dark)] text-[var(--color-accent)] flex items-center justify-center text-2xl font-['Fraunces'] font-bold shadow-xl ring-4 ring-white transition-all group-hover:scale-110 group-hover:-rotate-3">
            {getInitials(store.businessName)}
          </div>
          <div className="flex items-center gap-1.5 text-[var(--color-accent)] font-black text-sm bg-white px-3 py-1.5 rounded-full shadow-sm">
            <Star size={12} className="fill-current" />
            {Number(store.averageRating || 0).toFixed(1)}
          </div>
        </div>

        <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1 mb-2">
          {store.businessName}
        </h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] italic line-clamp-1">
          {store.address || 'Independent Artisan • Marketplace'}
        </p>

        <div className="mt-10 pt-8 border-t border-[var(--color-stone)]/10 flex items-center justify-between">
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">{store.productCount || 0}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-stone)]/60">Provisions</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">{store.reviewCount || 0}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-stone)]/60">Stories</p>
            </div>
          </div>
          
          <div className="w-12 h-12 bg-[var(--color-sand)]/20 flex items-center justify-center text-[var(--color-primary-dark)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all duration-500 group-hover:translate-x-1 shadow-sm">
            <ArrowRight size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, pages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-10 pt-20 border-t border-[var(--color-stone)]/10">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-stone)] disabled:opacity-20 hover:text-[var(--color-primary-dark)] transition-all group"
      >
        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
        <span className="hidden sm:inline">Previous Passage</span>
      </button>
      
      <div className="flex items-center gap-6">
        {pages.map((p, i) => (
          p === '...' ? <span key={`sep-${i}`} className="text-[var(--color-stone)]/40 font-bold">...</span> : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-10 h-10 text-[10px] font-black transition-all ${
                currentPage === p 
                  ? 'bg-[var(--color-primary-dark)] text-white shadow-xl shadow-[var(--color-primary)]/10 scale-110' 
                  : 'text-[var(--color-stone)]/50 hover:text-[var(--color-primary-dark)] hover:bg-[var(--color-sand)]/20'
              }`}
            >
              {String(p).padStart(2, '0')}
            </button>
          )
        ))}
      </div>

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-stone)] disabled:opacity-20 hover:text-[var(--color-primary-dark)] transition-all group"
      >
        <span className="hidden sm:inline">Next Discovery</span>
        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
