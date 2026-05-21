import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Heart, 
  Share2, 
  ArrowRight, 
  Plus, 
  Minus, 
  Star, 
  ShieldCheck, 
  Truck, 
  Clock, 
  MessageSquare,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Compass,
  Leaf,
  Flame,
  Utensils,
  X,
  Info,
  CheckCircle2,
  ArrowRight as ArrowRightIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../hooks/useToast';
import { isAuthenticated, getCurrentUserId, isCustomerRole } from '../utils/auth';
import SafeImage from '../components/SafeImage';
import SurfaceCard from '../components/SurfaceCard';
import { getProductById, getRecommendations, addProductReview } from '../api/marketplace';
import { addToCart } from '../api/customer';
import { addToWishlist } from '../api/wishlist';

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const currentUserId = getCurrentUserId();
  const isUserAuthenticated = isAuthenticated();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  // FETCH PRODUCT
  const { data: productData, isLoading: productLoading, error: productError, refetch: refetchProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProductById(productId)
  });

  // FETCH RECOMMENDATIONS
  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery({
    queryKey: ['recommendations', productId],
    queryFn: () => getRecommendations(productId)
  });

  const product = productData?.data || {};
  const productMeta = productData?.meta || {};
  const variants = product.variants || [];
  const rawImages = product.images?.length > 0 ? product.images : [product.imageUrl];
  const productImages = rawImages.map(img => typeof img === 'string' ? img : (img?.url || img?.imageUrl)).filter(Boolean);
  const safeSelectedImageIndex = Math.min(selectedImageIndex, productImages.length - 1);
  const selectedImage = productImages[safeSelectedImageIndex] || product.imageUrl;

  const sellerName = productMeta.sellerName || 'Artisan Studio';
  const sellerId = product.sellerId;
  const categoryName = product.categoryName || 'Heritage Provisions';

  // AUTH STATE
  const isCustomer = isCustomerRole();
  const hasPurchased = productMeta.userHasPurchased;
  const hasReviewed = productMeta.userHasReviewed;
  const canWriteReview = isCustomer && hasPurchased && !hasReviewed;

  // REVIEW DATA
  const productReviews = product.reviews || [];
  const reviewCount = productReviews.length;
  const averageRating = productReviews.length > 0 
    ? productReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / productReviews.length 
    : 0;

  const reviewBreakdown = useMemo(() => getReviewBreakdown(productReviews), [productReviews]);

  // MUTATIONS
  const cartMutation = useMutation({
    mutationFn: (item) => addToCart(item),
    onSuccess: () => {
      toast.success('Provision added to your basket.');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => toast.error('Failed to add provision.')
  });

  const wishlistMutation = useMutation({
    mutationFn: () => addToWishlist(productId),
    onSuccess: () => {
      toast.success('Provision added to your wishlist.');
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    onError: () => toast.error('Failed to update wishlist.')
  });

  const reviewMutation = useMutation({
    mutationFn: (review) => addProductReview(productId, review),
    onSuccess: () => {
      toast.success('Your narrative has been recorded.');
      setReviewModalOpen(false);
      setReviewForm({ rating: 5, comment: '' });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    onError: () => toast.error('Failed to record narrative.')
  });

  const isWishlisted = productMeta.isWishlisted;

  // VARIANT LOGIC
  useEffect(() => {
    if (variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(variants[0].id);
    }
  }, [variants, selectedVariantId]);

  const activeVariant = variants.find(v => v.id === selectedVariantId);
  const displayPrice = activeVariant ? activeVariant.price : product.price;
  const displayStock = activeVariant ? activeVariant.stock : product.stock;

  if (productLoading) return <ProductDetailsLoading />;

  if (productError || !product.id) {
    return (
      <div className="min-h-screen bg-[var(--color-sand)]/10 flex items-center justify-center p-6 pt-32">
        <div className="max-w-md w-full text-center space-y-10">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl">
             <Compass size={40} className="text-[var(--color-primary-dark)]" />
          </div>
          <SurfaceCard
            className="p-12 border-[var(--color-stone)]/5 shadow-2xl"
          >
            <div className="space-y-8">
              <h2 className="text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Heritage Lost</h2>
              <p className="text-xl font-medium text-[var(--color-stone)] italic opacity-80 leading-relaxed">
                "The provision you seek has vanished into the archives of time, or was never truly part of this collection."
              </p>
              <div className="h-px bg-[var(--color-stone)]/10 w-24 mx-auto" />
              <button 
                onClick={() => navigate('/discovery')}
                className="w-full py-5 bg-[var(--color-primary-dark)] text-white font-black uppercase tracking-[0.2em] text-[10px] hover:brightness-110 active:scale-95 transition-all"
              >
                Return to Discovery
              </button>
            </div>
          </SurfaceCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24 pt-32 paper-texture">
      {/* MOBILE FLOATING ACTION BAR */}
      <AnimatePresence>
        {product.stock > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-[var(--color-stone)]/5 p-6 sm:hidden flex items-center justify-between gap-6 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Provision Price</p>
              <p className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">{formatCurrency(displayPrice)}</p>
            </div>
            <button
              onClick={() => cartMutation.mutate({ productId: Number(productId), quantity, productVariantId: selectedVariantId })}
              disabled={cartMutation.isPending || displayStock <= 0}
              className="px-10 py-5 bg-[var(--color-primary-dark)] text-white font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all"
            >
              {cartMutation.isPending ? 'Processing...' : 'Add to Basket'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* BREADCRUMBS */}
        <nav className="mb-16 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-stone)]/40">
          <Link to="/" className="hover:text-[var(--color-accent)] transition-colors">Home</Link>
          <span className="opacity-30">/</span>
          <Link to="/discovery" className="hover:text-[var(--color-accent)] transition-colors">Marketplace</Link>
          <span className="opacity-30">/</span>
          <span className="text-[var(--color-primary-dark)] truncate">{categoryName}</span>
          <span className="opacity-30">/</span>
          <span className="text-[var(--color-primary-dark)] opacity-100 truncate">{product.name}</span>
        </nav>

        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          {/* EXHIBIT GALLERY */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square bg-white overflow-hidden border border-[var(--color-stone)]/10 shadow-sm relative group"
            >
              <SafeImage
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-8 right-8">
                <button 
                  onClick={() => wishlistMutation.mutate()}
                  className={`w-14 h-14 flex items-center justify-center transition-all ${isWishlisted ? 'bg-[var(--color-accent)] text-white shadow-xl' : 'bg-white/80 backdrop-blur-md text-[var(--color-primary-dark)] hover:bg-white shadow-md'}`}
                >
                  <Heart size={24} className={isWishlisted ? 'fill-current' : ''} />
                </button>
              </div>
            </motion.div>

            <div className="grid grid-cols-4 gap-4">
              {productImages.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative aspect-square overflow-hidden border transition-all ${
                    idx === safeSelectedImageIndex ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20' : 'border-[var(--color-stone)]/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <SafeImage src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* EXHIBIT SPECS */}
          <div className="space-y-12">
            <div className="space-y-4">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)]">Artisanal Heritage</span>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-[1.05] tracking-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-6 pt-2">
                <span className="text-3xl lg:text-4xl font-['Fraunces'] font-medium text-[var(--color-primary-dark)]">
                  {formatCurrency(displayPrice)}
                </span>
                <div className="h-4 w-px bg-[var(--color-stone)]/20" />
                <div className="flex items-center gap-2">
                   <StarRow value={averageRating} size={14} />
                   <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-stone)]/50">({reviewCount} Stories)</span>
                </div>
              </div>
            </div>

            {/* THE STORY */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary-dark)]">The Story</h4>
              <p className="text-base text-[var(--color-stone)] leading-relaxed font-medium opacity-80">
                {product.description || "A masterfully crafted provision reflecting the depth of artisanal heritage. This unique creation is sourced with patience and reverence for authentic flavors, ensuring a complex profile that matures beautifully."}
              </p>
            </div>

            {/* TASTING NOTES */}
            <div className="p-8 bg-[var(--color-sand)]/20 border-l-4 border-[var(--color-accent)] italic space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)] non-italic">Tasting Notes</h4>
              <p className="text-lg font-['Fraunces'] text-[var(--color-primary-dark)] leading-relaxed">
                "Subtle notes of heritage tradition, balanced by a lingering, earthy finish that honors the land's original character."
              </p>
            </div>

            {/* SPECS LIST */}
            <div className="space-y-1 border-y border-[var(--color-stone)]/10 py-8">
               <SpecItem label="Ingredients" value="Organic Heritage Grains, Natural Extracts, Artisanal Craft" />
               <SpecItem label="Weight & Serving" value={product.weight || "750g (Serves 4-6)"} />
               <SpecItem label="Provenance" value={sellerName} />
            </div>

            {/* VARIANT SELECTOR */}
            {variants.length > 0 && (
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary-dark)]">Available Variants</h4>
                <div className="flex flex-wrap gap-4">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setQuantity(1);
                      }}
                      className={`px-8 py-4 border font-black uppercase tracking-widest text-[10px] transition-all ${
                        selectedVariantId === v.id
                          ? 'border-[var(--color-primary-dark)] bg-[var(--color-primary-dark)] text-white shadow-xl'
                          : 'border-[var(--color-stone)]/10 bg-white text-[var(--color-stone)] hover:border-[var(--color-accent)]/30'
                      }`}
                    >
                      {v.label} — {formatCurrency(v.price)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ACQUISITION MODULE */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border border-[var(--color-stone)]/10 p-2">
                <div className="flex items-center">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-14 h-14 flex items-center justify-center text-[var(--color-stone)] hover:text-[var(--color-primary-dark)] transition-all"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-12 text-center text-lg font-bold text-[var(--color-primary-dark)]">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(displayStock, q + 1))}
                    className="w-14 h-14 flex items-center justify-center text-[var(--color-stone)] hover:text-[var(--color-primary-dark)] transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className={`px-6 text-[10px] font-black uppercase tracking-[0.2em] ${displayStock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {displayStock > 0 ? `In Stock (${displayStock})` : 'Out of Stock'}
                </div>
              </div>

              <div className="space-y-4">
                <button
                  disabled={displayStock <= 0 || cartMutation.isPending || (variants.length > 0 && !selectedVariantId)}
                  onClick={() => {
                    if (!isUserAuthenticated) {
                      toast.info('Please sign in to add to your selection.');
                      navigate('/login');
                      return;
                    }
                    cartMutation.mutate({ productId: Number(productId), quantity, productVariantId: selectedVariantId });
                  }}
                  className="w-full py-6 bg-[var(--color-primary-dark)] text-white font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                >
                  {cartMutation.isPending ? 'Processing...' : 'Add to Basket'} <ArrowRight size={18} />
                </button>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Provision link copied for sharing.');
                  }}
                  className="w-full py-6 border border-[var(--color-stone)]/10 text-[var(--color-primary-dark)] font-black uppercase tracking-[0.3em] text-xs hover:bg-[var(--color-sand)]/20 transition-all flex items-center justify-center gap-3"
                >
                  Send as a Gift <Share2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-stone)]/60 justify-center">
                 <ShieldCheck size={14} className="text-emerald-600" />
                 Freshly prepared to order. Shipped in sustainable, thermal-insulated heritage packaging.
              </div>
            </div>
          </div>
        </div>

        {/* PHILOSOPHY SECTION */}
        <div className="mt-40 grid lg:grid-cols-3 gap-8">
           <PhilosophyCard 
             icon={<Leaf size={32} />} 
             title="Heritage Ingredients" 
             desc="We partner with local artisans and growers that practice regenerative agriculture, preserving the biodiversity of our native landscapes." 
           />
           <PhilosophyCard 
             dark 
             icon={<Flame size={32} />} 
             title="Small-Batch Fired" 
             desc="Slow-prepared at controlled temperatures to ensure the provision retains its nutritional integrity and achieves a perfect, artisanal density." 
           />
           <PhilosophyCard 
             icon={<Utensils size={32} />} 
             title="Natural Maturation" 
             desc="Our provisions are allowed to 'rest' for 24 hours post-creation, allowing the flavors to fully infuse for an unparalleled depth of taste." 
           />
        </div>

        {/* PERFECT PAIRINGS */}
        <div className="mt-40 pt-24 border-t border-[var(--color-stone)]/10">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Perfect <i className="text-[var(--color-accent)] font-medium">Pairings</i></h2>
            <Link to="/discovery" className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-primary-dark)] border-b border-[var(--color-primary-dark)] pb-1">View Pantry</Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {recommendationsLoading ? (
              [1, 2, 3, 4].map(n => <div key={n} className="aspect-square animate-pulse bg-[var(--color-sand)]/20" />)
            ) : (
              recommendations.slice(0, 4).map((rec, i) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  <Link to={`/product/${rec.id}`} className="group block">
                    <div className="aspect-square bg-white overflow-hidden border border-[var(--color-stone)]/10 relative">
                      <SafeImage src={rec.images?.[0] || rec.imageUrl} alt={rec.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    </div>
                    <h4 className="mt-4 font-['Fraunces'] font-semibold text-lg text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent)] transition-colors truncate">{rec.name}</h4>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] mt-1">{formatCurrency(rec.price)}</p>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* COMMUNITY NARRATIVES */}
        <div className="mt-48 grid gap-20 lg:grid-cols-3">
          <div>
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mb-6">Customer Stories</span>
            <h2 className="text-5xl lg:text-7xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-[1.05] tracking-tighter">
              Shared <i className="text-[var(--color-accent)] font-medium">Narratives</i>
            </h2>
            <p className="mt-8 text-[var(--color-stone)] font-medium text-lg leading-relaxed italic opacity-70">
              "Honest accounts from those who have savored our curated heritage provisions."
            </p>

            <div className="mt-12 p-12 bg-white border border-[var(--color-stone)]/10 relative overflow-hidden group">
              <div className="relative flex items-end gap-5 mb-10">
                <span className="text-7xl lg:text-8xl font-['Fraunces'] font-bold text-[var(--color-primary-dark)] tracking-tighter">{formatRating(averageRating)}</span>
                <div className="pb-4">
                  <StarRow value={averageRating} size={18} />
                  <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-stone)]/40 mt-3">{reviewCount} Verified Accounts</p>
                </div>
              </div>
              
              <div className="space-y-5">
                {[5, 4, 3, 2, 1].map(s => {
                  const count = reviewBreakdown[s] || 0;
                  const p = productReviews.length ? (count / productReviews.length) * 100 : 0;
                  return (
                    <div key={s} className="flex items-center gap-6">
                      <span className="text-[9px] font-black text-[var(--color-stone)]/40 w-12 uppercase tracking-widest">{s} Star</span>
                      <div className="flex-1 h-1 bg-[var(--color-sand)]/30 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${p}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-[var(--color-accent)]" 
                        />
                      </div>
                      <span className="text-[9px] font-black text-[var(--color-primary-dark)] w-10 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>

              {isCustomer && canWriteReview && (
                <button 
                  onClick={() => setReviewModalOpen(true)}
                  className="w-full mt-12 py-5 bg-[var(--color-primary-dark)] text-white font-black uppercase tracking-[0.2em] text-[10px] hover:brightness-110 active:scale-95 transition-all shadow-xl"
                >
                  Share Your Story
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {productReviews.length === 0 ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-20 bg-white border border-[var(--color-stone)]/10 text-center relative overflow-hidden">
                <Compass size={40} className="text-[var(--color-stone)]/20 mb-8" />
                <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Awaiting First Narrative</h3>
                <p className="mt-4 text-[var(--color-stone)] font-medium italic opacity-60">"Be the first to record your experience with this heritage provision."</p>
              </div>
            ) : (
              <div className="space-y-8">
                {productReviews.map((r, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="p-12 bg-white border border-[var(--color-stone)]/10 group relative"
                  >
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-[var(--color-sand)]/30 flex items-center justify-center text-xl font-['Fraunces'] font-bold text-[var(--color-primary-dark)]">
                          {r.userName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="font-['Fraunces'] text-xl font-semibold text-[var(--color-primary-dark)]">{r.userName || 'Anonymous Collector'}</p>
                            <ShieldCheck size={14} className="text-emerald-600" />
                          </div>
                          <p className="text-[9px] font-black text-[var(--color-stone)]/40 uppercase tracking-widest mt-1 italic">{formatDate(r.createdAt)}</p>
                        </div>
                      </div>
                      <StarRow value={r.rating} size={14} />
                    </div>
                    
                    <p className="text-xl text-[var(--color-stone)] font-medium leading-relaxed italic border-l-2 border-[var(--color-accent)] pl-8 ml-2">
                      "{r.comment}"
                    </p>

                    <div className="mt-10 pt-8 border-t border-[var(--color-stone)]/5 flex gap-4">
                      <div className="w-8 h-8 bg-[var(--color-primary-dark)] flex items-center justify-center text-[var(--color-accent)] font-black text-[10px] shrink-0 shadow-lg">
                        {sellerName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-[var(--color-primary-dark)] uppercase tracking-widest mb-1 italic">Artisan's Note</p>
                        <p className="text-xs text-[var(--color-stone)] font-medium italic opacity-60 leading-relaxed">"Grateful for your appreciation of our craft. We honor the trust you place in our heritage provisions."</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ARTISAN FOOTER MODULE */}
      <div className="mt-40 bg-[var(--color-primary-dark)] text-white py-32 px-6 overflow-hidden relative">
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 relative z-10">
            <div className="space-y-12">
               <div>
                  <h2 className="text-6xl lg:text-8xl font-['Fraunces'] font-semibold leading-tight tracking-tighter mb-8">
                     Honoring the <i className="text-[var(--color-accent)] font-medium">Source</i>
                  </h2>
                  <p className="text-xl text-white/60 leading-relaxed max-w-xl font-medium italic">
                     "We believe in provisions that whisper stories of the land and honor the seasons. Every creation is a testament to the artisans who preserve our heritage."
                  </p>
               </div>
               
               <div className="flex gap-12">
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Studio</h4>
                     <p className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-accent)]">{sellerName}</p>
                  </div>
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Inquiry</h4>
                     {Number(productMeta?.sellerUserId) !== Number(currentUserId) && (
                       <Link to={`/chat/${productMeta?.sellerUserId}`} className="text-xs font-bold uppercase tracking-widest hover:text-[var(--color-accent)] transition-colors flex items-center gap-2">
                          Message Artisan <ArrowUpRight size={14} />
                       </Link>
                     )}
                  </div>
               </div>
            </div>
            
            <div className="flex flex-col justify-between">
               <div className="p-12 border border-white/10 space-y-8 bg-white/5 backdrop-blur-sm">
                  <h4 className="text-2xl font-['Fraunces'] font-semibold">Artisanal Newsletter</h4>
                  <p className="text-sm text-white/60 italic leading-relaxed">"Join our inner circle for quiet updates and seasonal harvests directly from the studio."</p>
                  <div className="flex gap-4 border-b border-white/20 pb-4">
                     <input type="email" placeholder="Provision Email" className="bg-transparent flex-1 outline-none font-medium italic" />
                     <button className="text-[var(--color-accent)]"><ArrowRight size={20} /></button>
                  </div>
               </div>
               
               <div className="flex items-center justify-between pt-16">
                  <Link to={`/store/${sellerId}`} className="text-[10px] font-black uppercase tracking-[0.3em] hover:text-[var(--color-accent)] transition-colors">Visit Studio</Link>
                  <div className="flex gap-6">
                     <Share2 size={18} className="text-white/40 hover:text-white cursor-pointer transition-colors" />
                     <Compass size={18} className="text-white/40 hover:text-white cursor-pointer transition-colors" />
                  </div>
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 blur-[150px] rounded-full -mr-[400px] -mt-[400px]" />
      </div>

      {reviewModalOpen && (
        <ProductReviewModal
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          onClose={() => setReviewModalOpen(false)}
          onSubmit={() => {
            if (!reviewForm.comment.trim()) {
              toast.error('Please share your feedback.');
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

      {/* SUB-COMPONENTS */}
      <style>{`
         .paper-texture {
            background-color: #fcfaf7;
            background-image: url("https://www.transparenttextures.com/patterns/natural-paper.png");
         }
      `}</style>
    </div>
  );
}

function SpecItem({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-stone)]/5 last:border-0">
      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-stone)]/40">{label}</span>
      <span className="text-xs font-bold text-[var(--color-primary-dark)] text-right">{value}</span>
    </div>
  );
}

function PhilosophyCard({ icon, title, desc, dark }) {
  return (
    <div className={`p-12 border ${dark ? 'bg-[var(--color-primary-dark)] text-white border-white/5' : 'bg-white text-[var(--color-primary-dark)] border-[var(--color-stone)]/10'} space-y-8`}>
      <div className={`${dark ? 'text-[var(--color-accent)]' : 'text-[var(--color-accent)]'}`}>{icon}</div>
      <h3 className="text-3xl font-['Fraunces'] font-semibold leading-tight">{title}</h3>
      <p className={`text-base leading-relaxed opacity-70 italic font-medium`}>{desc}</p>
    </div>
  );
}

function ProductReviewModal({ reviewForm, setReviewForm, onClose, onSubmit, isSubmitting }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--color-primary-dark)]/60 px-6 backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="w-full max-w-2xl border border-white/20 bg-white p-12 sm:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent)]/10 blur-[100px] rounded-full -mr-32 -mt-32" />
          
          <div className="flex items-start justify-between gap-8 mb-12 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                <Sparkles size={12} />
                Write a Story
              </div>
              <h3 className="text-5xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tighter leading-tight">Share Your <i className="text-[var(--color-accent)] font-medium">Narrative</i></h3>
              <p className="mt-6 text-lg text-[var(--color-stone)] font-medium italic opacity-70 leading-relaxed">
                "Your account helps other collectors savor the true essence of this provision."
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-14 h-14 bg-[var(--color-sand)]/20 border border-[var(--color-stone)]/5 flex items-center justify-center text-[var(--color-stone)] hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-10 relative z-10">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-stone)]/40 ml-2 mb-6 block italic">Rate this provision</label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setReviewForm((current) => ({ ...current, rating }))}
                    className={`flex-1 h-16 border font-bold transition-all flex items-center justify-center gap-2 ${
                      reviewForm.rating === rating
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] shadow-xl'
                        : 'border-[var(--color-stone)]/10 bg-white text-[var(--color-stone)] hover:border-[var(--color-accent)]/30'
                    }`}
                  >
                    {rating} <Star size={14} className={reviewForm.rating >= rating ? 'fill-current' : ''} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-stone)]/40 ml-2 mb-6 block italic">Your Narrative</label>
              <div className="relative group">
                <textarea
                  rows="5"
                  value={reviewForm.comment}
                  onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                  placeholder="Record your experience with this provision..."
                  className="w-full border border-[var(--color-stone)]/10 bg-[var(--color-sand)]/5 px-10 py-8 text-xl font-medium text-[var(--color-primary-dark)] outline-none transition-all focus:bg-white focus:border-[var(--color-accent)]/20 shadow-inner italic min-h-[220px] scrollbar-hide"
                />
              </div>
            </div>
          </div>

          <div className="mt-16 flex items-center gap-6 relative z-10">
            <button
              onClick={onClose}
              className="flex-1 h-18 py-5 border border-[var(--color-stone)]/10 font-black uppercase tracking-widest text-[10px] text-[var(--color-stone)] hover:bg-[var(--color-sand)]/20 transition-all"
            >
              Discard
            </button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-[2] h-18 py-5 bg-[var(--color-primary-dark)] text-white font-black uppercase tracking-widest text-[10px] shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                'Publishing...'
              ) : (
                <>Publish Narrative <ArrowUpRight size={18} /></>
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
    <div className="min-h-screen bg-[var(--color-background)] px-6 pb-24 pt-32 paper-texture">
      <div className="mx-auto max-w-7xl space-y-16 animate-pulse">
        <div className="grid gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="aspect-square bg-[var(--color-sand)]/20 shadow-sm" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square bg-[var(--color-sand)]/20" />)}
            </div>
          </div>
          <div className="space-y-10">
            <div className="h-6 w-48 bg-[var(--color-sand)]/20" />
            <div className="h-20 w-full bg-[var(--color-sand)]/20" />
            <div className="h-40 w-full bg-[var(--color-sand)]/20" />
            <div className="h-64 w-full bg-[var(--color-sand)]/20" />
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
