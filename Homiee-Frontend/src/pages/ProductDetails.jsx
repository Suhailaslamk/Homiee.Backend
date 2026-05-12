import React, { useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Share2,
  Info,
  Layers,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Compass,
  ArrowLeft
} from 'lucide-react';
import {
  addProductReview,
  getProductById,
  getProductReviews,
  getProducts,
  getCategories,
  getRecommendations,
} from '../api/marketplace';
import { addToCart, getMyOrders } from '../api/customer';
import { addToWishlist, getWishlist } from '../api/wishlist';
import { motion, AnimatePresence } from 'framer-motion';
import SafeImage from '../components/SafeImage';
import SurfaceCard from '../components/SurfaceCard';
import StatePanel from '../components/StatePanel';
import { useToast } from '../hooks/useToast';
import { getCurrentRole, isCustomerRole, getCurrentUserId, isAuthenticated } from '../utils/auth';

export default function ProductDetails() {
  const { productId } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = getCurrentRole();
  const isCustomer = isCustomerRole(role);
  const currentUserId = getCurrentUserId();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });

  const { data: productResponse, isLoading: productLoading, error: productError, refetch: refetchProduct } = useQuery({
    queryKey: ['product-details', productId],
    queryFn: () => getProductById(productId),
    enabled: Boolean(productId),
  });

  const product = productResponse?.data;

  const { data: productMetaResponse } = useQuery({
    queryKey: ['product-meta', productId, product?.name],
    queryFn: async () => {
      const searchTerm = product?.name?.trim();
      const response = await getProducts({
        page: 1,
        pageSize: 50,
        search: searchTerm || undefined,
      });

      const items = response?.data?.data ?? [];
      return items.find((item) => String(item.id) === String(productId)) || null;
    },
    enabled: Boolean(productId && product?.name),
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 5,
  });

  const { data: reviewsResponse, isLoading: reviewsLoading, error: reviewsError, refetch: refetchReviews } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: () => getProductReviews(productId),
    enabled: Boolean(productId),
  });

  const { data: ordersResponse } = useQuery({
    queryKey: ['customer-orders-for-product-review'],
    queryFn: getMyOrders,
    enabled: isCustomer,
  });

  const { data: wishlistResponse } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    enabled: isCustomer,
  });

  const { data: recommendationsResponse, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['product-recommendations', productId],
    queryFn: () => getRecommendations(productId),
    enabled: Boolean(productId),
  });

  const productReviews = reviewsResponse?.data ?? [];
  const productMeta = productMetaResponse || null;
  const recommendations = recommendationsResponse ?? [];
  const categoryMap = useMemo(
    () => Object.fromEntries((categoriesResponse?.data ?? []).map((category) => [category.id, category.name])),
    [categoriesResponse]
  );
  const productImages = product?.images?.length ? product.images : [null];
  const safeSelectedImageIndex = Math.min(selectedImageIndex, Math.max(productImages.length - 1, 0));
  const selectedImage = productImages[safeSelectedImageIndex];
  const reviewBreakdown = getReviewBreakdown(productReviews);
  const reviewCount = productMeta?.reviewCount ?? productReviews.length;
  const averageRating =
    productMeta?.averageRating ??
    (productReviews.length
      ? productReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / productReviews.length
      : 0);
  const categoryName = categoryMap[product?.categoryId] || (product?.categoryId ? `Category #${product.categoryId}` : 'Uncategorized');
  const eligibleOrders = (ordersResponse?.data ?? []).filter(
    (order) =>
      order.status === 'Delivered' &&
      order.items?.some((item) => String(item.productId) === String(productId))
  );
  const canWriteReview = isCustomer && eligibleOrders.length > 0;
  const wishlistItems = wishlistResponse?.data ?? [];
  const isWishlisted = wishlistItems.some((item) => String(item.productId) === String(productId));
  const sellerName = productMeta?.businessName || productMeta?.sellerName || 'Homiee store';
  const sellerId = productMeta?.sellerId;

  const cartMutation = useMutation({
    mutationFn: addToCart,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Piece added to your acquisition bag.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to add piece to bag.');
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: () => addToWishlist(Number(productId)),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Piece added to your curated vault.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to add to wishlist.');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (payload) => addProductReview(productId, payload),
    onSuccess: (response) => {
      if (response?.isSuccess) {
        toast.success('Your story has been added to the community.');
        setReviewModalOpen(false);
        setReviewForm({ rating: 5, comment: '' });
        queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
        queryClient.invalidateQueries({ queryKey: ['product-meta', productId, product?.name] });
        return;
      }
      toast.error(response?.message || 'Unable to publish review.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to publish review.');
    },
  });

  if (productLoading) {
    return <ProductDetailsLoading />;
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen bg-[var(--color-sand)]/10 px-6 pb-24 pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <StatePanel
            className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
            message={(
              <div>
                <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-6">Unable to sync exhibit parameters.</p>
                <button onClick={refetchProduct} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry Synchronization</button>
              </div>
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-sand)]/10 pb-24 pt-32">
      {/* MOBILE FLOATING ACTION BAR */}
      <AnimatePresence>
        {product.stock > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-[var(--color-stone)]/5 p-6 sm:hidden flex items-center justify-between gap-6 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] rounded-t-[3rem]"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Valuation</p>
              <p className="text-2xl font-bold text-[var(--color-primary-dark)]">{formatCurrency(product.price)}</p>
            </div>
            <button
              onClick={() => cartMutation.mutate({ productId: Number(productId), quantity })}
              disabled={cartMutation.isPending}
              className="px-10 py-5 bg-[var(--color-primary-dark)] text-white font-bold rounded-[1.8rem] shadow-2xl active:scale-95 transition-all"
            >
              {cartMutation.isPending ? 'Syncing...' : 'Add to Bag'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-6">
        {/* BREADCRUMBS */}
        <nav className="mb-12 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          <Link to="/" className="hover:text-[var(--color-accent)] transition-colors">Home</Link>
          <ChevronRight size={10} className="opacity-30" />
          <Link to="/discovery" className="hover:text-[var(--color-accent)] transition-colors">Treasures</Link>
          <ChevronRight size={10} className="opacity-30" />
          <span className="text-[var(--color-primary-dark)] truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid gap-16 lg:grid-cols-2">
          {/* EXHIBIT GALLERY */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square bg-white rounded-[4rem] overflow-hidden border border-[var(--color-stone)]/5 shadow-2xl relative group"
            >
              <SafeImage
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <button 
                onClick={async () => {
                  const shareData = {
                    title: product.name,
                    text: `Check out this artisanal piece: ${product.name}`,
                    url: window.location.href,
                  };

                  try {
                    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                      await navigator.share(shareData);
                    } else {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success('Gallery link copied to your clipboard.');
                    }
                  } catch (err) {
                    // Fallback for clipboard if share fails or is blocked
                    try {
                      const el = document.createElement('textarea');
                      el.value = window.location.href;
                      document.body.appendChild(el);
                      el.select();
                      document.execCommand('copy');
                      document.body.removeChild(el);
                      toast.success('Gallery link copied to your clipboard.');
                    } catch (fallbackErr) {
                      toast.error('Unable to copy link.');
                    }
                  }
                }}
                className="absolute bottom-8 right-8 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 z-50 hover:bg-white/20"
              >
                <Share2 size={24} />
              </button>
            </motion.div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`flex-shrink-0 w-28 h-28 rounded-[2rem] overflow-hidden border-2 transition-all shadow-sm ${
                    idx === safeSelectedImageIndex ? 'border-[var(--color-accent)] scale-105' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <SafeImage src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* EXHIBIT STORY */}
            <div className="pt-16 space-y-10">
              <div>
                <h2 className="text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight mb-6">Exhibit Narrative</h2>
                <p className="text-xl text-[var(--color-stone)] leading-relaxed font-medium italic opacity-80">
                  {product.description || "Every masterpiece has a narrative. This curated item was handpicked for its exceptional quality and the artisan skill required to create it. A timeless addition that brings soul to your living space."}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="p-8 bg-white rounded-[3rem] border border-[var(--color-stone)]/5 shadow-xl hover:shadow-2xl transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)] mb-6">
                    <Truck size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-[var(--color-primary-dark)]">Studio Logistics</h4>
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2 leading-relaxed">Carefully orchestrated delivery directly from the local artisan hub.</p>
                </div>
                <div className="p-8 bg-white rounded-[3rem] border border-[var(--color-stone)]/5 shadow-xl hover:shadow-2xl transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)] mb-6">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-[var(--color-primary-dark)]">Origin Verified</h4>
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2 leading-relaxed">Inspected and validated through the Homiee artisan integrity network.</p>
                </div>
              </div>
            </div>
          </div>

          {/* EXHIBIT SPECS */}
          <div className="lg:sticky lg:top-32 space-y-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <StarRow value={averageRating} size={16} />
                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Registry Data ({reviewCount} Observations)</span>
              </div>
              
              <h1 className="text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tighter leading-[1.1]">
                {product.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="px-5 py-2.5 bg-white border border-[var(--color-stone)]/5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)] shadow-sm">
                  {categoryName}
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] ${product.stock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {product.stock > 0 ? (
                    <><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {product.stock} Pieces Allocated</>
                  ) : (
                    'Allocation Depleted'
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] italic">Acquisition Valuation</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[var(--color-accent)]">₹</span>
                <p className="text-6xl font-bold text-[var(--color-primary-dark)] tracking-tighter">{product.price.toLocaleString('en-IN')}</p>
              </div>
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest italic pt-2 flex items-center gap-2">
                <Info size={12} /> Includes studio orchestration and community reinvestment.
              </p>
            </div>

            {/* ACQUISITION MODULE */}
            <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 rounded-[4rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] space-y-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-sand)]/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
              
              <div className="relative z-10 flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary-dark)]">Volume Allocation</label>
                <div className="flex items-center bg-[var(--color-sand)]/20 rounded-2xl border border-[var(--color-stone)]/5 p-1.5 shadow-inner">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-[var(--color-stone)] hover:bg-white hover:text-[var(--color-primary-dark)] transition-all"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="w-16 text-center text-xl font-bold text-[var(--color-primary-dark)]">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-[var(--color-stone)] hover:bg-white hover:text-[var(--color-primary-dark)] transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="relative z-10 grid grid-cols-5 gap-6">
                <button
                  disabled={product.stock <= 0 || cartMutation.isPending}
                  onClick={() => {
                    if (!isAuthenticated()) {
                      toast.info('Please log in to add this piece to your bag.');
                      navigate('/login');
                      return;
                    }
                    cartMutation.mutate({ productId: Number(productId), quantity });
                  }}
                  className="col-span-4 h-20 bg-[var(--color-primary-dark)] text-white font-bold rounded-[2rem] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                >
                  {cartMutation.isPending ? (
                    <><Clock size={24} className="animate-spin" /> Syncing...</>
                  ) : (
                    <>Add to Bag <ArrowRight size={24} className="group-hover/btn:translate-x-2 transition-transform" /></>
                  )}
                </button>
                <button
                  disabled={(isAuthenticated() && !isCustomer) || isWishlisted || wishlistMutation.isPending}
                  onClick={() => {
                    if (!isAuthenticated()) {
                      toast.info('Please log in to add this piece to your vault.');
                      navigate('/login');
                      return;
                    }
                    wishlistMutation.mutate();
                  }}
                  className={`flex items-center justify-center h-20 rounded-[2rem] border-2 transition-all ${
                    isWishlisted 
                      ? 'bg-rose-500 border-rose-500 text-white shadow-xl shadow-rose-500/20' 
                      : 'bg-white border-[var(--color-stone)]/10 text-[var(--color-stone)] hover:border-rose-500 hover:text-rose-500'
                  }`}
                >
                  <Heart size={28} className={isWishlisted ? 'fill-current' : ''} />
                </button>
              </div>
            </SurfaceCard>

            {/* ARTISAN MODULE */}
            <SurfaceCard className="bg-[var(--color-primary-dark)] text-white p-10 rounded-[4rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 blur-3xl rounded-full -mr-20 -mt-20 group-hover:bg-white/10 transition-all duration-1000" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-bold font-['Fraunces'] text-[var(--color-accent)] border border-white/10 shadow-2xl">
                    {sellerName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-2xl font-bold">{sellerName}</h4>
                      <div className="w-5 h-5 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-[var(--color-primary-dark)]">
                        <CheckCircle2 size={12} />
                      </div>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mt-1 italic">Authorized Independent Studio</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Link to={`/store/${sellerId}`} className="h-14 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-xs font-bold uppercase tracking-widest transition-all border border-white/5">
                    View Portfolio
                  </Link>
                  {Number(productMeta?.sellerUserId) !== Number(currentUserId) && (
                    <Link to={`/chat/${productMeta?.sellerUserId}`} className="h-14 bg-[var(--color-accent)] text-[var(--color-primary-dark)] hover:scale-[1.02] rounded-2xl flex items-center justify-center text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-[var(--color-accent)]/20">
                      Message Studio
                    </Link>
                  )}
                </div>
              </div>
            </SurfaceCard>
          </div>
        </div>

        {/* RELATED TREASURES */}
        <div className="mt-40 pt-24 border-t border-[var(--color-stone)]/5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                <Sparkles size={12} />
                Curated Recommendations
              </div>
              <h2 className="text-5xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Resonating <i className="text-[var(--color-accent)]">Visions</i></h2>
              <p className="text-[var(--color-text-muted)] mt-4 font-medium italic opacity-70">"Pieces that mirror the aesthetic soul of your current exploration."</p>
            </div>
            <Link 
              to="/discovery" 
              className="group inline-flex items-center gap-3 text-[10px] font-bold text-[var(--color-primary-dark)] uppercase tracking-[0.3em] hover:text-[var(--color-accent)] transition-colors"
            >
              Explore Collection <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            {recommendationsLoading ? (
              [1, 2, 3, 4].map(n => <div key={n} className="aspect-[3/4] animate-pulse bg-[var(--color-sand)]/20 rounded-[3rem]" />)
            ) : (
              recommendations.slice(0, 4).map((rec, i) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link to={`/product/${rec.id}`} className="group block">
                    <div className="aspect-[3/4] bg-white rounded-[3rem] overflow-hidden border border-[var(--color-stone)]/5 shadow-xl transition-all group-hover:shadow-2xl group-hover:-translate-y-2 relative">
                    <SafeImage src={rec.images?.[0] || rec.imageUrl} alt={rec.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                    </div>
                    <h4 className="mt-6 font-['Fraunces'] font-bold text-xl text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent)] transition-colors truncate">{rec.name}</h4>
                    <p className="text-sm font-bold text-[var(--color-accent)] mt-2 italic">{formatCurrency(rec.price)}</p>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* COMMUNITY NARRATIVES */}
        <div className="mt-48 grid gap-20 lg:grid-cols-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
              <MessageSquare size={12} />
              The Community Ledger
            </div>
            <h2 className="text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-[1.1] tracking-tighter">
              Collector <i className="text-[var(--color-accent)]">Narratives</i>
            </h2>
            <p className="mt-8 text-[var(--color-stone)] font-medium text-lg leading-relaxed italic opacity-70">
              "Authentic reflections from those who have already welcomed this piece into their personal sanctuary."
            </p>

            <div className="mt-12 p-12 bg-white rounded-[4rem] border border-[var(--color-stone)]/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent)]/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
              
              <div className="relative flex items-end gap-5 mb-10">
                <span className="text-8xl font-['Fraunces'] font-bold text-[var(--color-primary-dark)] tracking-tighter">{formatRating(averageRating)}</span>
                <div className="pb-4">
                  <StarRow value={averageRating} size={20} />
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-3">{reviewCount} Verified Observations</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {[5, 4, 3, 2, 1].map(s => {
                  const count = reviewBreakdown[s] || 0;
                  const p = productReviews.length ? (count / productReviews.length) * 100 : 0;
                  return (
                    <div key={s} className="flex items-center gap-6">
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)] w-12 uppercase tracking-widest">{s} Star</span>
                      <div className="flex-1 h-2 bg-[var(--color-sand)]/30 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${p}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-[var(--color-accent)]" 
                        />
                      </div>
                      <span className="text-[10px] font-bold text-[var(--color-primary-dark)] w-10 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>

              {isCustomer && canWriteReview && (
                <button 
                  onClick={() => setReviewModalOpen(true)}
                  className="w-full mt-12 h-16 bg-[var(--color-primary-dark)] text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-[var(--color-primary-dark)]/20"
                >
                  Share Your Story
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-12">
            {productReviews.length === 0 ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-20 bg-white rounded-[5rem] border-2 border-dashed border-[var(--color-stone)]/10 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-sand),transparent_70%)] opacity-30" />
                <div className="w-24 h-24 bg-[var(--color-sand)]/30 rounded-[2rem] flex items-center justify-center mb-10 relative z-10 shadow-inner">
                  <Compass size={40} className="text-[var(--color-stone)]/40 animate-pulse" />
                </div>
                <h3 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] relative z-10">Uncharted Narrative</h3>
                <p className="mt-4 text-lg font-medium text-[var(--color-text-muted)] italic max-w-sm relative z-10">"Be the first collector to define the legacy of this artisanal piece."</p>
              </div>
            ) : (
              <div className="grid gap-10">
                {productReviews.map((r, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-12 bg-white rounded-[4rem] border border-[var(--color-stone)]/5 shadow-xl hover:shadow-2xl transition-all duration-700 group relative"
                  >
                    <div className="flex items-start justify-between mb-10">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-2xl font-bold font-['Fraunces'] text-[var(--color-primary-dark)] group-hover:bg-[var(--color-accent)] transition-colors">
                          {r.userName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="font-['Fraunces'] text-2xl font-semibold text-[var(--color-primary-dark)]">{r.userName || 'Anonymous Collector'}</p>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                              <ShieldCheck size={12} /> Verified Acquisition
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-2 italic">{formatDate(r.createdAt)}</p>
                        </div>
                      </div>
                      <StarRow value={r.rating} size={18} />
                    </div>
                    
                    <div className="relative">
                      <p className="text-2xl text-[var(--color-stone)] font-medium leading-relaxed italic pr-12">
                        "{r.comment}"
                      </p>
                      <div className="absolute bottom-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles size={48} className="text-[var(--color-accent)]" />
                      </div>
                    </div>

                    <div className="mt-12 pt-10 border-t border-[var(--color-stone)]/5 flex gap-6">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-dark)] flex items-center justify-center text-[var(--color-accent)] font-black text-sm shrink-0 shadow-lg">
                        {sellerName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[10px] font-bold text-[var(--color-primary-dark)] uppercase tracking-widest">Artisan Signal</p>
                          <CheckCircle2 size={10} className="text-[var(--color-accent)]" />
                        </div>
                        <p className="text-sm text-[var(--color-stone)] font-medium italic opacity-80 leading-relaxed">"We are deeply honored to have this piece resonate within your space. Thank you for supporting independent craft."</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {reviewModalOpen && (
        <ProductReviewModal
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          onClose={() => setReviewModalOpen(false)}
          onSubmit={() => {
            if (!reviewForm.comment.trim()) {
              toast.error('Please articulate your experience.');
              return;
            }
            reviewMutation.mutate({
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

function ProductReviewModal({ reviewForm, setReviewForm, onClose, onSubmit, isSubmitting }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--color-primary-dark)]/60 px-6 backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="w-full max-w-2xl rounded-[4rem] border border-white/20 bg-white p-12 sm:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent)]/10 blur-[100px] rounded-full -mr-32 -mt-32" />
          
          <div className="flex items-start justify-between gap-8 mb-12 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                <Sparkles size={12} />
                Artisan Validation
              </div>
              <h3 className="text-5xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tighter leading-tight">Compose Your <i className="text-[var(--color-accent)]">Narrative</i></h3>
              <p className="mt-6 text-lg text-[var(--color-stone)] font-medium italic opacity-70 leading-relaxed">
                "Your reflection immortalizes the legacy of this piece within the community registry."
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-14 h-14 rounded-2xl bg-[var(--color-sand)]/20 border border-[var(--color-stone)]/5 flex items-center justify-center text-[var(--color-stone)] hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
            >
              <Plus size={24} className="rotate-45" />
            </button>
          </div>

          <div className="space-y-10 relative z-10">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] ml-2 mb-6 block italic">Resonance Rating</label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setReviewForm((current) => ({ ...current, rating }))}
                    className={`flex-1 h-16 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                      reviewForm.rating === rating
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] shadow-xl scale-[1.05]'
                        : 'border-[var(--color-stone)]/5 bg-[var(--color-sand)]/10 text-[var(--color-stone)] hover:border-[var(--color-accent)]/30'
                    }`}
                  >
                    {rating} <Star size={14} className={reviewForm.rating >= rating ? 'fill-current' : ''} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] ml-2 mb-6 block italic">The Narrative Submission</label>
              <div className="relative group">
                <textarea
                  rows="5"
                  value={reviewForm.comment}
                  onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                  placeholder="Articulate the soul of this piece..."
                  className="w-full rounded-[2.5rem] border-2 border-transparent bg-[var(--color-sand)]/5 px-10 py-8 text-xl font-medium text-[var(--color-primary-dark)] outline-none transition-all focus:bg-white focus:border-[var(--color-accent)]/20 shadow-inner italic min-h-[220px] scrollbar-hide"
                />
                <div className="absolute bottom-6 right-8 opacity-20 group-focus-within:opacity-100 transition-opacity">
                  <PenToolIcon size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 flex items-center gap-6 relative z-10">
            <button
              onClick={onClose}
              className="flex-1 h-18 py-5 rounded-[1.8rem] border-2 border-[var(--color-stone)]/5 font-bold text-[var(--color-stone)] hover:bg-[var(--color-sand)]/20 transition-all"
            >
              Discard Entry
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-[2] h-18 py-5 bg-[var(--color-primary-dark)] text-white rounded-[1.8rem] font-bold text-lg shadow-2xl shadow-[var(--color-primary-dark)]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Clock size={20} className="animate-spin" /> Publishing...</>
              ) : (
                <>Publish Narrative <ArrowUpRight size={20} /></>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function ProductDetailsLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-sand)]/10 px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl space-y-16 animate-pulse">
        <div className="grid gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="aspect-square bg-[var(--color-sand)]/20 rounded-[4rem]" />
            <div className="flex gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-28 h-28 bg-[var(--color-sand)]/20 rounded-[2rem]" />)}
            </div>
          </div>
          <div className="space-y-10">
            <div className="h-10 w-48 bg-[var(--color-sand)]/20 rounded-full" />
            <div className="h-24 w-full bg-[var(--color-sand)]/20 rounded-[2rem]" />
            <div className="h-40 w-full bg-[var(--color-sand)]/20 rounded-[3rem]" />
            <div className="h-64 w-full bg-[var(--color-sand)]/20 rounded-[4rem]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PenToolIcon({ size }) { return <MessageSquare size={size} />; }

function getReviewBreakdown(reviews) {
  return reviews.reduce((accumulator, review) => {
    const rating = Number(review.rating || 0);
    accumulator[rating] = (accumulator[rating] || 0) + 1;
    return accumulator;
  }, {});
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatRating(value) {
  return Number(value || 0).toFixed(1);
}

function formatDate(value) {
  if (!value) return 'Recently';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function StarRow({ value, size = 14 }) {
  const roundedValue = Math.round(Number(value || 0));
  return (
    <div className="flex items-center gap-1 text-[var(--color-accent)]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={size}
          className={index < roundedValue ? 'fill-current' : 'text-[var(--color-stone)]/10'}
        />
      ))}
    </div>
  );
}
