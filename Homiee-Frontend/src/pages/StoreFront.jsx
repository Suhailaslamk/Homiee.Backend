import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  MessageCircle,
  Phone,
  Search,
  Star,
  Store,
  Tag,
  ChevronDown,
  Filter,
  X,
  Sparkles,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Compass,
  ShoppingBag,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Info,
  LayoutGrid,
  Plus,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { addSellerReview, getSellerReviews, getStoreDetails, getCategories } from '../api/marketplace';
import { getMyOrders } from '../api/customer';
import SafeImage from '../components/SafeImage';
import SurfaceCard from '../components/SurfaceCard';
import StatePanel from '../components/StatePanel';
import { getResponseData } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { getCurrentRole, isCustomerRole, getCurrentUserId, isAuthenticated } from '../utils/auth';
import { motion, AnimatePresence } from 'framer-motion';

export default function StoreFront() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const role = getCurrentRole();
  const isCustomer = isCustomerRole(role);
  const currentUserId = getCurrentUserId();

  // Redirect 'me' to actual userId if it appears in URL
  useEffect(() => {
    if (sellerId === 'me') {
      if (currentUserId) {
        navigate(`/store/${currentUserId}`, { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [sellerId, currentUserId, navigate]);

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 12,
    search: '',
    minPrice: '',
    maxPrice: '',
    categoryId: '',
    sortBy: 'newest',
    desc: true,
    minRating: '',
  });
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    orderId: '',
    rating: 5,
    comment: '',
  });
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const storeQuery = useMemo(
    () => ({
      page: filters.page,
      pageSize: filters.pageSize,
      search: filters.search.trim() || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      categoryId: filters.categoryId || undefined,
      sortBy: resolveStoreProductSort(filters.sortBy, filters.desc),
      desc: resolveStoreProductDesc(filters.sortBy, filters.desc),
      minRating: filters.minRating || undefined,
    }),
    [filters]
  );

  const { data: storeResponse, isLoading: storeLoading, error: storeError, refetch: refetchStore } = useQuery({
    queryKey: ['storefront', sellerId, storeQuery],
    queryFn: () => getStoreDetails(sellerId, storeQuery),
    enabled: Boolean(sellerId),
  });

  const { data: reviewsResponse, isLoading: reviewsLoading, error: reviewsError, refetch: refetchReviews } = useQuery({
    queryKey: ['store-reviews', sellerId],
    queryFn: () => getSellerReviews(sellerId),
    enabled: Boolean(sellerId),
  });

  const { data: ordersResponse } = useQuery({
    queryKey: ['customer-orders-for-seller-review'],
    queryFn: getMyOrders,
    enabled: isCustomer,
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 5,
  });

  const allCategories = getResponseData(categoriesResponse) || [];
  const categoryMap = useMemo(
    () => Object.fromEntries(allCategories.map((c) => [c.id, c.name])),
    [allCategories]
  );

  const reviewMutation = useMutation({
    mutationFn: (payload) => addSellerReview(sellerId, payload),
    onSuccess: (response) => {
      if (response?.isSuccess) {
        toast.success('Your story has been added to the studio ledger.');
        setReviewModalOpen(false);
        setReviewForm({ orderId: '', rating: 5, comment: '' });
        queryClient.invalidateQueries({ queryKey: ['store-reviews', sellerId] });
        queryClient.invalidateQueries({ queryKey: ['storefront', sellerId] });
        return;
      }
      toast.error(response?.message || 'Unable to publish review.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to publish review.');
    },
  });

  if (storeLoading) {
    return <StoreFrontLoading />;
  }

  if (storeError || !storeResponse?.data) {
    return (
      <div className="min-h-screen bg-[var(--color-sand)]/10 px-6 pb-24 pt-32">
        <div className="mx-auto max-w-4xl">
          <StatePanel
            className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
            message={(
              <div className="text-center">
                <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-6">Unable to identify studio coordinates.</p>
                <button onClick={refetchStore} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry Discovery</button>
              </div>
            )}
          />
        </div>
      </div>
    );
  }

  const store = storeResponse.data;
  const storeMeta = store.store || {};
  const productsPage = store.products;
  const products = productsPage?.data ?? [];
  const reviews = reviewsResponse?.data ?? [];
  const categories = Array.from(new Set(products.map((product) => product.categoryId))).filter(Boolean);
  const eligibleOrders = (ordersResponse?.data ?? []).filter(
    (order) => String(order.sellerId) === String(sellerId) && order.status === 'Delivered'
  );
  const canWriteReview = isCustomer && eligibleOrders.length > 0;
  const reviewBreakdown = getReviewBreakdown(reviews);
  const pageNumbers = getPageNumbers(productsPage?.page ?? 1, productsPage?.totalPages ?? 1);
  const displayProductCount = storeMeta.productCount ?? productsPage?.totalCount ?? products.length;
  const description = storeMeta.address || store.address || 'An independent studio dedicated to the mastery of craft and community support.';

  return (
    <div className="min-h-screen bg-[var(--color-sand)]/10 pb-24 pt-32 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Studio Header */}
        <section className="relative mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[4rem] border border-white bg-white/40 backdrop-blur-3xl shadow-2xl relative"
          >
            {/* Header Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-accent)] blur-[120px] rounded-full -mr-48 -mt-48" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--color-primary-dark)] blur-[120px] rounded-full -ml-48 -mb-48" />
            </div>

            <div className="relative p-10 sm:p-16 flex flex-col lg:flex-row items-center lg:items-end justify-between gap-12">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 text-center lg:text-left">
                <div className="w-32 h-32 rounded-[2.5rem] bg-[var(--color-primary-dark)] text-[var(--color-accent)] flex items-center justify-center text-5xl font-['Fraunces'] font-bold shadow-2xl border-4 border-white transition-transform hover:rotate-3 duration-500">
                  {getInitials(store.businessName)}
                </div>

                <div className="max-w-2xl">
                  <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-full text-[10px] font-black uppercase tracking-widest border border-[var(--color-accent)]/20">
                      <ShieldCheck size={14} /> Authorized Studio
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/50 text-[var(--color-primary-dark)] rounded-full text-[10px] font-bold uppercase tracking-widest border border-[var(--color-stone)]/5 shadow-sm">
                      <Star size={14} className="fill-[var(--color-accent)] text-[var(--color-accent)]" /> {formatRating(store.averageRating)} | {store.reviewCount ?? 0} Signals
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/50 text-[var(--color-primary-dark)] rounded-full text-[10px] font-bold uppercase tracking-widest border border-[var(--color-stone)]/5 shadow-sm">
                      <LayoutGrid size={14} /> {displayProductCount} Exhibits
                    </div>
                  </div>

                  <h1 className="text-5xl sm:text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tighter leading-tight mb-6">
                    {store.businessName}
                  </h1>
                  <p className="text-xl text-[var(--color-stone)] font-medium italic opacity-70 leading-relaxed pr-8">
                    "{description}"
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                {Number(sellerId) !== Number(currentUserId) && (
                  <button
                    onClick={() => {
                      if (!isAuthenticated()) {
                        toast.info('Please log in to transmit messages to this studio.');
                        navigate('/login');
                        return;
                      }
                      navigate(`/chat/${store.sellerUserId}`, { state: { name: store.businessName, subtitle: 'Ask about custom orchestration or studio exhibits.' } });
                    }}
                    className="h-20 px-10 bg-[var(--color-primary-dark)] text-white font-bold rounded-3xl flex items-center justify-center gap-4 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all group"
                  >
                    <MessageSquare size={24} /> Transmit Message
                  </button>
                )}
                {store.phoneNumber && (
                  <a
                    href={`tel:${store.phoneNumber}`}
                    className="h-20 px-8 bg-white border border-[var(--color-stone)]/10 text-[var(--color-primary-dark)] font-bold rounded-3xl flex items-center justify-center gap-4 shadow-xl hover:bg-[var(--color-sand)]/20 transition-all"
                  >
                    <Phone size={24} /> {store.phoneNumber}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </section>

        <div className="grid gap-16 lg:grid-cols-[380px,1fr]">
          {/* Studio Refinement */}
          <aside className="space-y-10">
            <SurfaceCard className="bg-white/60 backdrop-blur-xl border-white p-10 rounded-[3.5rem] shadow-2xl space-y-12 h-fit lg:sticky lg:top-32">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-sand)]/50 flex items-center justify-center text-[var(--color-primary-dark)]">
                  <Filter size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Curation</p>
                  <h2 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Refine Studio</h2>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2">Identify Exhibit</label>
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-stone)]/30" size={18} />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, page: 1, search: e.target.value }))}
                      placeholder="Search exhibits..."
                      className="w-full bg-white border border-[var(--color-stone)]/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium outline-none focus:border-[var(--color-accent)]/20 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2">Specialization</label>
                  <select
                    value={filters.categoryId}
                    onChange={(e) => setFilters(prev => ({ ...prev, page: 1, categoryId: e.target.value }))}
                    className="w-full bg-white border border-[var(--color-stone)]/5 rounded-2xl px-6 py-4 text-sm font-bold text-[var(--color-primary-dark)] outline-none focus:border-[var(--color-accent)]/20 transition-all cursor-pointer shadow-sm"
                  >
                    <option value="">All Specializations</option>
                    {categories.map((catId) => (
                      <option key={catId} value={catId}>{categoryMap[catId] || `Category #${catId}`}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2">Valuation Range</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number" placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, page: 1, minPrice: e.target.value }))}
                      className="bg-white border border-[var(--color-stone)]/5 rounded-2xl px-5 py-4 text-sm font-bold outline-none shadow-inner"
                    />
                    <input
                      type="number" placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, page: 1, maxPrice: e.target.value }))}
                      className="bg-white border border-[var(--color-stone)]/5 rounded-2xl px-5 py-4 text-sm font-bold outline-none shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2">Observation Threshold</label>
                  <div className="flex gap-2">
                    {[4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setFilters(prev => ({ ...prev, page: 1, minRating: prev.minRating === rating ? '' : rating }))}
                        className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all text-xs ${
                          Number(filters.minRating) === rating ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)] border-transparent' : 'bg-white text-[var(--color-stone)] border-[var(--color-stone)]/5 hover:border-[var(--color-accent)]/20'
                        }`}
                      >
                        {rating}★ Plus
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setFilters({ page: 1, pageSize: 12, search: '', minPrice: '', maxPrice: '', categoryId: '', sortBy: 'newest', desc: true, minRating: '' })}
                  className="w-full py-5 rounded-2xl border border-[var(--color-stone)]/10 font-bold text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] hover:text-rose-500 transition-colors"
                >
                  Reset Parameters
                </button>
              </div>
            </SurfaceCard>
          </aside>

          {/* Studio Portfolio */}
          <div className="space-y-16">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Studio Exhibits</h2>
                <p className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2 italic">A curated catalog of artisanal treasures</p>
              </div>

              <div className="flex items-center gap-4">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, page: 1, sortBy: e.target.value }))}
                  className="bg-white border border-[var(--color-stone)]/5 rounded-2xl px-6 py-4 text-sm font-bold text-[var(--color-primary-dark)] outline-none shadow-sm cursor-pointer"
                >
                  <option value="newest">Genesis Order</option>
                  <option value="price_asc">Valuation: Min</option>
                  <option value="price_desc">Valuation: Max</option>
                  <option value="rating">Top Choice</option>
                </select>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: 1, desc: !prev.desc }))}
                  className={`w-14 h-14 rounded-2xl border transition-all flex items-center justify-center ${filters.desc ? 'bg-[var(--color-primary-dark)] text-white' : 'bg-white text-[var(--color-stone)] border-[var(--color-stone)]/10'}`}
                >
                  <ChevronDown size={24} className={filters.desc ? '' : 'rotate-180'} />
                </button>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="py-32 text-center bg-white border border-[var(--color-stone)]/5 rounded-[4rem] shadow-xl">
                <Sparkles size={64} className="mx-auto text-[var(--color-stone)]/20 mb-8" />
                <h3 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Portfolio Quiet</h3>
                <p className="mt-4 text-[var(--color-text-muted)] italic max-w-sm mx-auto leading-relaxed">"No exhibits match your current exploration parameters. Try broadening your scope."</p>
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
                      <StudioExhibitCard 
                        product={product} 
                        onClick={() => navigate(`/product/${product.id}`)} 
                      />
                    </motion.div>
                  ))}
                </div>

                <Pagination
                  currentPage={productsPage?.page ?? 1}
                  totalPages={productsPage?.totalPages ?? 1}
                  pages={pageNumbers}
                  onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                />
              </div>
            )}

            {/* Studio Signals (Reviews) */}
            <div className="pt-24 border-t border-[var(--color-stone)]/5 grid gap-16 lg:grid-cols-[1fr,1.5fr]">
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 rounded-[3.5rem] shadow-2xl h-fit">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-sand)]/50 flex items-center justify-center text-[var(--color-primary-dark)]">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Signals</p>
                    <h2 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Studio Ledger</h2>
                  </div>
                </div>

                <div className="flex items-end gap-5 mb-12 bg-[var(--color-sand)]/10 p-8 rounded-[2.5rem] border border-[var(--color-stone)]/5">
                  <p className="text-6xl font-['Fraunces'] font-bold text-[var(--color-primary-dark)] tracking-tighter">{formatRating(store.averageRating)}</p>
                  <div className="pb-3">
                    <StarRow value={store.averageRating} size={18} />
                    <p className="mt-3 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{store.reviewCount ?? 0} Observations</p>
                  </div>
                </div>

                <div className="space-y-5 mb-10">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewBreakdown[star] || 0;
                    const percent = reviews.length ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-5">
                        <span className="w-10 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{star}★</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-sand)]/30">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1 }} className="h-full bg-[var(--color-accent)]" />
                        </div>
                        <span className="w-8 text-right text-[10px] font-bold text-[var(--color-primary-dark)]">{count}</span>
                      </div>
                    );
                  })}
                </div>

                {isCustomer && (
                  <button
                    onClick={() => {
                      if (!canWriteReview) {
                        toast.info('You may contribute to the ledger after a successful acquisition from this studio.');
                        return;
                      }
                      setReviewModalOpen(true);
                    }}
                    className="w-full py-5 bg-[var(--color-primary-dark)] text-white font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Contribute Signal
                  </button>
                )}
              </SurfaceCard>

              <div className="space-y-10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Recent Signals</h2>
                    <p className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2 italic">Authentic narratives from the collector community</p>
                  </div>
                  {reviewsLoading && <Clock className="animate-spin text-[var(--color-stone)]/30" size={24} />}
                </div>

                {reviews.length === 0 ? (
                  <div className="p-16 text-center bg-white border border-[var(--color-stone)]/5 rounded-[4rem] shadow-xl">
                    <p className="text-lg text-[var(--color-text-muted)] italic">"This studio ledger currently has no public entries."</p>
                  </div>
                ) : (
                  <div className="grid gap-8">
                    {reviews.map((review, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-10 bg-white border border-[var(--color-stone)]/5 rounded-[3.5rem] shadow-xl hover:shadow-2xl transition-all group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-[var(--color-sand)]/50 flex items-center justify-center text-xl font-bold font-['Fraunces'] text-[var(--color-primary-dark)] group-hover:bg-[var(--color-accent)] transition-colors">
                              {(review.userName || 'P').charAt(0)}
                            </div>
                            <div>
                              <p className="text-lg font-bold text-[var(--color-primary-dark)]">{review.userName || 'Collector'}</p>
                              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1 italic">{formatDate(review.createdAt)}</p>
                            </div>
                          </div>
                          <StarRow value={review.rating} size={16} />
                        </div>
                        <p className="text-xl text-[var(--color-stone)] font-medium italic leading-relaxed pr-8 opacity-80 group-hover:opacity-100 transition-opacity">
                          "{review.comment}"
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {reviewModalOpen && (
        <ReviewModal
          eligibleOrders={eligibleOrders}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          onClose={() => setReviewModalOpen(false)}
          onSubmit={() => {
            if (!reviewForm.orderId) {
              toast.error('Choose a valid acquisition reference.');
              return;
            }
            if (!reviewForm.comment.trim()) {
              toast.error('Share a short narrative.');
              return;
            }
            reviewMutation.mutate({
              orderId: Number(reviewForm.orderId),
              rating: reviewForm.rating,
              comment: reviewForm.comment.trim(),
            });
          }}
          isSubmitting={reviewMutation.isPending}
        />
      )}
    </div>
  );
}

function StudioExhibitCard({ product, onClick }) {
  return (
    <SurfaceCard
      onClick={onClick}
      className="bg-white border-[var(--color-stone)]/5 p-0 overflow-hidden shadow-xl rounded-[3rem] group transition-all hover:shadow-2xl"
    >
      <div className="aspect-square overflow-hidden relative">
        <SafeImage src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
        <div className="absolute top-6 right-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black text-[var(--color-primary-dark)] shadow-xl">
          {formatCurrency(product.price)}
        </div>
      </div>

      <div className="p-8">
        <div className="mb-4 flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${product.isAvailable ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
            {product.isAvailable ? `In Studio (${product.stock})` : 'Allocation Void'}
          </span>
          <div className="flex items-center gap-1.5 text-[var(--color-accent)] font-bold text-xs">
            <Star size={12} className="fill-current" />
            {formatRating(product.averageRating)}
          </div>
        </div>

        <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent)] transition-colors leading-tight truncate">{product.name}</h3>
        <p className="mt-3 line-clamp-2 text-sm text-[var(--color-text-muted)] font-medium italic opacity-70">
          {product.description || 'Tap through to examine the full narrative and craftsmanship behind this piece.'}
        </p>

        <div className="mt-8 flex items-center justify-between pt-6 border-t border-[var(--color-stone)]/5">
          <div className="flex items-center gap-2 text-[10px] font-black text-[var(--color-primary-dark)] uppercase tracking-widest group-hover:text-[var(--color-accent)] transition-colors">
            Examine <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

function ReviewModal({ eligibleOrders, reviewForm, setReviewForm, onClose, onSubmit, isSubmitting }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-primary-dark)]/60 px-6 backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="w-full max-w-2xl rounded-[4rem] border border-white/20 bg-white p-12 sm:p-16 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent)]/10 blur-[100px] rounded-full -mr-32 -mt-32" />
          
          <div className="flex items-start justify-between gap-8 mb-12 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                <Sparkles size={12} />
                Studio Validation
              </div>
              <h3 className="text-5xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tighter leading-tight">Compose Your <i className="text-[var(--color-accent)]">Signal</i></h3>
              <p className="mt-6 text-lg text-[var(--color-stone)] font-medium italic opacity-70 leading-relaxed">"Your reflection immortalizes the legacy of this studio within the community registry."</p>
            </div>
            <button onClick={onClose} className="w-14 h-14 rounded-2xl bg-[var(--color-sand)]/20 border border-[var(--color-stone)]/5 flex items-center justify-center text-[var(--color-stone)] hover:text-rose-500 transition-all active:scale-90">
              <Plus size={24} className="rotate-45" />
            </button>
          </div>

          <div className="space-y-10 relative z-10">
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] ml-2 italic">Acquisition Reference</label>
              <select
                value={reviewForm.orderId}
                onChange={(e) => setReviewForm(prev => ({ ...prev, orderId: e.target.value }))}
                className="w-full bg-[var(--color-sand)]/5 border border-[var(--color-stone)]/5 rounded-2xl px-6 py-4 text-sm font-bold text-[var(--color-primary-dark)] outline-none shadow-inner"
              >
                <option value="">Choose your order...</option>
                {eligibleOrders.map((order) => (
                  <option key={order.id} value={order.id}>Reference #{order.id} — {formatDate(order.createdAt)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] ml-2 italic">Resonance Rating</label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setReviewForm(prev => ({ ...prev, rating }))}
                    className={`flex-1 h-14 rounded-2xl border-2 font-bold transition-all text-xs flex items-center justify-center gap-2 ${
                      reviewForm.rating === rating ? 'bg-[var(--color-accent)] text-[var(--color-primary-dark)] border-transparent shadow-lg scale-105' : 'bg-white text-[var(--color-stone)] border-[var(--color-stone)]/5 hover:border-[var(--color-accent)]/30'
                    }`}
                  >
                    {rating} <Star size={12} className={reviewForm.rating >= rating ? 'fill-current' : ''} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] ml-2 italic">The Narrative Submission</label>
              <textarea
                rows="5"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Articulate the soul of your experience with this studio..."
                className="w-full bg-[var(--color-sand)]/5 border border-[var(--color-stone)]/5 rounded-[2.5rem] px-8 py-6 text-lg font-medium text-[var(--color-primary-dark)] outline-none shadow-inner italic scrollbar-hide min-h-[160px]"
              />
            </div>
          </div>

          <div className="mt-12 flex items-center gap-6 relative z-10">
            <button onClick={onClose} className="flex-1 h-18 py-5 rounded-[1.8rem] border-2 border-[var(--color-stone)]/5 font-bold text-[var(--color-stone)] hover:bg-[var(--color-sand)]/20 transition-all">Discard Signal</button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-[2] h-18 py-5 bg-[var(--color-primary-dark)] text-white rounded-[1.8rem] font-bold text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? <><Clock size={20} className="animate-spin" /> Publishing...</> : <>Publish Signal <ArrowUpRight size={20} /></>}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Pagination({ currentPage, totalPages, pages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 pt-12">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-14 h-14 rounded-2xl bg-white border border-[var(--color-stone)]/5 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 transition-all hover:bg-[var(--color-sand)]/20"
      >
        <ChevronLeft size={24} />
      </button>
      <div className="flex items-center gap-2">
        {pages.map((p, i) => (
          <button
            key={i}
            onClick={() => onPageChange(p)}
            className={`w-12 h-12 rounded-2xl font-bold transition-all ${currentPage === p ? 'bg-[var(--color-primary-dark)] text-white shadow-xl' : 'bg-white text-[var(--color-text-muted)] border border-[var(--color-stone)]/5'}`}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-14 h-14 rounded-2xl bg-white border border-[var(--color-stone)]/5 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 transition-all hover:bg-[var(--color-sand)]/20"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
}

function StoreFrontLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-sand)]/10 px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl space-y-16 animate-pulse">
        <div className="h-80 bg-[var(--color-sand)]/20 rounded-[4rem]" />
        <div className="grid gap-16 lg:grid-cols-[380px,1fr]">
          <div className="h-[32rem] bg-[var(--color-sand)]/20 rounded-[3.5rem]" />
          <div className="space-y-10">
            <div className="h-24 bg-[var(--color-sand)]/20 rounded-[2.5rem]" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-96 bg-[var(--color-sand)]/20 rounded-[3rem]" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



function getReviewBreakdown(reviews) {
  return reviews.reduce((accumulator, review) => {
    const rating = Number(review.rating || 0);
    accumulator[rating] = (accumulator[rating] || 0) + 1;
    return accumulator;
  }, {});
}

function resolveStoreProductSort(sortBy, desc) {
  if (sortBy === 'price_asc') return 'price';
  if (sortBy === 'price_desc') return 'price';
  return sortBy;
}

function resolveStoreProductDesc(sortBy, desc) {
  if (sortBy === 'price_asc') return false;
  if (sortBy === 'price_desc') return true;
  return desc;
}

function getPageNumbers(currentPage, totalPages) {
  if (!totalPages) return [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatRating(value) { return Number(value || 0).toFixed(1); }

function formatDate(value) {
  if (!value) return 'Genesis';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));
}

function getInitials(value = '') {
  return value.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'S';
}

function StarRow({ value, size = 14 }) {
  const roundedValue = Math.round(Number(value || 0));
  return (
    <div className="flex items-center gap-1 text-[var(--color-accent)]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={size} className={index < roundedValue ? 'fill-current' : 'text-[var(--color-stone)]/10'} />
      ))}
    </div>
  );
}
