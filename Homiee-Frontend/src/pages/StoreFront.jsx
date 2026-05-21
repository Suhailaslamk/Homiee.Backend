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
        toast.success('Your review has been submitted.');
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
                <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-6">Unable to find store.</p>
                <button onClick={refetchStore} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry</button>
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
    <div className="min-h-screen bg-[var(--color-background)] pb-24 pt-32 px-6 paper-texture">
      <div className="mx-auto max-w-7xl">
        {/* Cinematic Studio Header */}
        <section className="mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2rem] bg-[var(--color-primary-dark)] p-8 sm:p-16 text-center"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--color-accent),transparent_70%)]" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl bg-white text-[var(--color-primary-dark)] flex items-center justify-center text-4xl classic-heading shadow-2xl mb-8">
                {getInitials(store.businessName)}
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <span className="exhibit-label text-white/60">Store ID: #{sellerId}</span>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="flex items-center gap-1 text-[var(--color-accent)] font-bold text-sm">
                  <Star size={14} className="fill-current" />
                  {formatRating(store.averageRating)}
                </div>
              </div>

              <h1 className="classic-heading text-3xl sm:text-6xl text-white mb-6">
                {store.businessName}
              </h1>
              
              <p className="text-base sm:text-xl text-white/70 font-medium italic max-w-2xl leading-relaxed px-4">
                "{description}"
              </p>

              <div className="mt-12 flex flex-wrap justify-center gap-6">
                {Number(sellerId) !== Number(currentUserId) && (
                  <button
                    onClick={() => {
                      if (!isAuthenticated()) {
                        toast.info('Please log in to send a message to this store.');
                        navigate('/login');
                        return;
                      }
                      navigate(`/chat/${store.sellerUserId}`, { state: { name: store.businessName, subtitle: 'Ask about products or orders.' } });
                    }}
                    className="h-14 px-8 bg-white text-[var(--color-primary-dark)] font-bold rounded-xl shadow-xl hover:scale-105 transition-all flex items-center gap-3"
                  >
                    <MessageSquare size={18} /> Send Message
                  </button>
                )}
                {store.phoneNumber && (
                  <a
                    href={`tel:${store.phoneNumber}`}
                    className="h-14 px-8 bg-transparent border border-white/20 text-white font-bold rounded-xl hover:bg-white/5 transition-all flex items-center gap-3"
                  >
                    <Phone size={18} /> {store.phoneNumber}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </section>

        <div className="grid gap-16 lg:grid-cols-[380px,1fr]">
          {/* Studio Refinement */}
          <aside className="space-y-6 sm:space-y-10">
            <div className="classic-card p-6 sm:p-10 space-y-8 sm:space-y-12 h-fit lg:sticky lg:top-32">
              <div className="flex items-center gap-4 border-b border-[var(--color-stone)]/10 pb-6">
                <div className="w-10 h-10 rounded-full bg-[var(--color-sand)]/50 flex items-center justify-center text-[var(--color-primary-dark)]">
                  <Filter size={18} />
                </div>
                <h2 className="classic-heading text-xl">Filters</h2>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="exhibit-label">Search</label>
                  <div className="relative">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--color-stone)]/30" size={16} />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, page: 1, search: e.target.value }))}
                      placeholder="Search products..."
                      className="w-full bg-transparent border-b border-[var(--color-stone)]/20 py-3 pl-8 pr-4 text-sm font-medium outline-none focus:border-[var(--color-accent)] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="exhibit-label">Categories</label>
                  <select
                    value={filters.categoryId}
                    onChange={(e) => setFilters(prev => ({ ...prev, page: 1, categoryId: e.target.value }))}
                    className="w-full bg-transparent border-b border-[var(--color-stone)]/20 py-3 text-sm font-bold text-[var(--color-primary-dark)] outline-none focus:border-[var(--color-accent)] transition-all cursor-pointer"
                  >
                    <option value="">All Areas</option>
                    {categories.map((catId) => (
                      <option key={catId} value={catId}>{categoryMap[catId] || `Category #${catId}`}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="exhibit-label">Price Range</label>
                  <div className="grid grid-cols-2 gap-8">
                    <input
                      type="number" placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, page: 1, minPrice: e.target.value }))}
                      className="bg-transparent border-b border-[var(--color-stone)]/20 py-3 text-sm font-bold outline-none focus:border-[var(--color-accent)]"
                    />
                    <input
                      type="number" placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, page: 1, maxPrice: e.target.value }))}
                      className="bg-transparent border-b border-[var(--color-stone)]/20 py-3 text-sm font-bold outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setFilters({ page: 1, pageSize: 12, search: '', minPrice: '', maxPrice: '', categoryId: '', sortBy: 'newest', desc: true, minRating: '' })}
                  className="w-full py-4 text-rose-600 exhibit-label text-[0.6rem] hover:underline"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </aside>

          {/* Studio Portfolio */}
          <div className="space-y-16">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Store Products</h2>
                <p className="text-xs sm:text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2 italic">A curated collection</p>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, page: 1, sortBy: e.target.value }))}
                  className="flex-1 sm:flex-none bg-white border border-[var(--color-stone)]/5 rounded-2xl px-6 py-4 text-sm font-bold text-[var(--color-primary-dark)] outline-none shadow-sm cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: 1, desc: !prev.desc }))}
                  className={`w-14 h-14 rounded-2xl border transition-all flex items-center justify-center shrink-0 ${filters.desc ? 'bg-[var(--color-primary-dark)] text-white' : 'bg-white text-[var(--color-stone)] border-[var(--color-stone)]/10'}`}
                >
                  <ChevronDown size={24} className={filters.desc ? '' : 'rotate-180'} />
                </button>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="py-32 text-center bg-white/40 border border-[var(--color-stone)]/10 rounded-[2rem]">
                <Sparkles size={48} className="mx-auto text-[var(--color-stone)]/20 mb-6" />
                <h3 className="classic-heading text-3xl">No Products Found</h3>
                <p className="mt-4 text-[var(--color-text-muted)] italic max-w-sm mx-auto">"Try adjusting your filters to find what you're looking for."</p>
              </div>
            ) : (
              <div className="space-y-16">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-12">
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
            <div className="pt-24 border-t border-[var(--color-stone)]/10 grid gap-16 lg:grid-cols-[1fr,1.5fr]">
              <div className="classic-card p-10 h-fit">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-sand)]/50 flex items-center justify-center text-[var(--color-primary-dark)]">
                  <CheckCircle2 size={20} />
                  </div>
                  <h2 className="classic-heading text-xl">Store Reviews</h2>
                </div>

                <div className="flex items-end gap-5 mb-12">
                  <p className="text-6xl classic-heading">{formatRating(store.averageRating)}</p>
                  <div className="pb-2">
                    <StarRow value={store.averageRating} size={16} />
                    <p className="mt-2 exhibit-label text-[0.55rem]">{store.reviewCount ?? 0} Reviews</p>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewBreakdown[star] || 0;
                    const percent = reviews.length ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-4">
                        <span className="w-8 exhibit-label text-[0.5rem]">{star}★</span>
                        <div className="h-0.5 flex-1 overflow-hidden bg-[var(--color-stone)]/10">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1 }} className="h-full bg-[var(--color-primary-dark)]" />
                        </div>
                        <span className="w-6 text-right exhibit-label text-[0.5rem]">{count}</span>
                      </div>
                    );
                  })}
                </div>

                {isCustomer && (
                  <button
                    onClick={() => {
                      if (!canWriteReview) {
                      toast.info('You can write a review after your order is delivered.');
                        return;
                      }
                      setReviewModalOpen(true);
                    }}
                    className="w-full py-4 bg-[var(--color-primary-dark)] text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              <div className="space-y-12">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="classic-heading text-3xl">Customer Reviews</h2>
                  {reviewsLoading && <Clock className="animate-spin text-[var(--color-stone)]/30" size={20} />}
                </div>

                {reviews.length === 0 ? (
                  <div className="p-16 text-center border border-[var(--color-stone)]/10 rounded-[2rem]">
                    <p className="text-lg text-[var(--color-text-muted)] italic">"This store has no reviews yet."</p>
                  </div>
                ) : (
                  <div className="grid gap-12">
                    {reviews.map((review, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="pb-12 border-b border-[var(--color-stone)]/10 last:border-0"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[var(--color-sand)]/50 flex items-center justify-center classic-heading text-xl">
                              {(review.userName || 'P').charAt(0)}
                            </div>
                            <div>
                              <p className="text-lg font-bold text-[var(--color-primary-dark)]">{review.userName || 'Customer'}</p>
                              <p className="exhibit-label text-[0.5rem] mt-0.5">{formatDate(review.createdAt)}</p>
                            </div>
                          </div>
                          <StarRow value={review.rating} size={14} />
                        </div>
                        <p className="text-xl text-[var(--color-text-muted)] font-medium italic leading-relaxed">
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
              toast.error('Please select an order to review.');
              return;
            }
            if (!reviewForm.comment.trim()) {
              toast.error('Please write a short review.');
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
    <div
      onClick={onClick}
      className="classic-card overflow-hidden group cursor-pointer"
    >
      <div className="aspect-square overflow-hidden relative">
        <SafeImage src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
        <div className="absolute top-6 right-6 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-lg exhibit-label text-[0.6rem] shadow-sm">
          {formatCurrency(product.price)}
        </div>
      </div>
      <div className="p-4 sm:p-8">
        <div className="mb-2 flex items-center justify-between">
          <span className={`exhibit-label text-[0.5rem] sm:text-[0.55rem] ${product.isAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
            {product.isAvailable ? 'In Stock' : 'Out of Stock'}
          </span>
          <div className="flex items-center gap-1 text-[var(--color-accent)] font-bold text-[10px]">
            <Star size={10} className="fill-current" />
            {formatRating(product.averageRating)}
          </div>
        </div>
        <h3 className="classic-heading text-base sm:text-xl group-hover:text-[var(--color-accent)] transition-colors truncate">{product.name}</h3>
        <p className="mt-2 line-clamp-2 text-xs text-[var(--color-text-muted)] font-medium italic opacity-70">
          {product.description || 'View product details.'}
        </p>
        <div className="mt-4 sm:mt-8 flex items-center justify-between pt-4 sm:pt-6 border-t border-[var(--color-stone)]/10">
          <div className="exhibit-label text-[0.4rem] sm:text-[0.55rem] flex items-center gap-1 group-hover:text-[var(--color-accent)] transition-colors">
            View <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

    </div>
  );
}
function ReviewModal({ eligibleOrders, reviewForm, setReviewForm, onClose, onSubmit, isSubmitting }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-primary-dark)]/40 px-6 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl classic-card p-12 relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-8 mb-12">
            <div>
              <h3 className="classic-heading text-4xl mb-4">Write a Review</h3>
              <p className="text-sm text-[var(--color-text-muted)] italic leading-relaxed">"Share your experience with the community."</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--color-sand)]/50 flex items-center justify-center text-[var(--color-primary-dark)] hover:text-rose-500 transition-all">
              <Plus size={20} className="rotate-45" />
            </button>
          </div>

          <div className="space-y-10">
            <div className="space-y-4">
              <label className="exhibit-label text-[0.6rem]">Select Order</label>
              <select
                value={reviewForm.orderId}
                onChange={(e) => setReviewForm(prev => ({ ...prev, orderId: e.target.value }))}
                className="w-full bg-transparent border-b border-[var(--color-stone)]/20 py-3 text-sm font-bold text-[var(--color-primary-dark)] outline-none focus:border-[var(--color-accent)]"
              >
                <option value="">Select order...</option>
                {eligibleOrders.map((order) => (
                  <option key={order.id} value={order.id}>Order #{order.id.slice(-6).toUpperCase()} — {formatDate(order.createdAt)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="exhibit-label text-[0.6rem]">Rating</label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setReviewForm(prev => ({ ...prev, rating }))}
                    className={`flex-1 h-12 rounded-lg border transition-all text-xs flex items-center justify-center gap-2 ${
                      reviewForm.rating === rating 
                        ? 'bg-[var(--color-primary-dark)] text-white border-transparent' 
                        : 'bg-white text-[var(--color-stone)] border-[var(--color-stone)]/20 hover:border-[var(--color-accent)]'
                    }`}
                  >
                    {rating} <Star size={10} className={reviewForm.rating >= rating ? 'fill-current' : ''} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="exhibit-label text-[0.6rem]">Your Review</label>
              <textarea
                rows="4"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share the details of your experience..."
                className="w-full bg-[var(--color-sand)]/10 border border-[var(--color-stone)]/10 rounded-xl px-6 py-4 text-sm font-medium text-[var(--color-primary-dark)] outline-none focus:border-[var(--color-accent)] italic"
              />
            </div>
          </div>

          <div className="mt-12 flex items-center gap-6">
            <button onClick={onClose} className="flex-1 h-14 exhibit-label text-[0.6rem] text-[var(--color-stone)] hover:underline">Discard</button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-[2] h-14 bg-[var(--color-primary-dark)] text-white rounded-xl font-bold shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? <Clock size={18} className="animate-spin" /> : <>Submit Review <ArrowRight size={18} /></>}
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
    <div className="flex items-center justify-center gap-6 pt-16">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="exhibit-label text-[0.6rem] text-[var(--color-stone)] disabled:opacity-30 hover:text-[var(--color-primary-dark)] transition-all flex items-center gap-2"
      >
        <ChevronLeft size={16} /> Previous
      </button>
      <div className="flex items-center gap-4">
        {pages.map((p, i) => (
          <button
            key={i}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-full exhibit-label text-[0.6rem] transition-all ${currentPage === p ? 'bg-[var(--color-primary-dark)] text-white shadow-md' : 'text-[var(--color-stone)] hover:bg-[var(--color-sand)]/20'}`}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="exhibit-label text-[0.6rem] text-[var(--color-stone)] disabled:opacity-30 hover:text-[var(--color-primary-dark)] transition-all flex items-center gap-2"
      >
        Next <ChevronRight size={16} />
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
