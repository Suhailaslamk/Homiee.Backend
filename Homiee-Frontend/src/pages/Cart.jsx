import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowRight, 
  Minus, 
  Package2, 
  Plus, 
  ShoppingBag, 
  Store, 
  Trash2, 
  Sparkles, 
  CreditCard,
  ChevronLeft,
  ShoppingBasket,
  Zap,
  Layers,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addToCart, getCart, removeFromCart } from '../api/customer';
import { getProductById, getSellerById } from '../api/marketplace';
import SafeImage from '../components/SafeImage';
import SurfaceCard from '../components/SurfaceCard';
import StatePanel from '../components/StatePanel';
import { useToast } from '../hooks/useToast';
import { getResponseData } from '../utils/api';

export default function Cart() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
  });

  const cartItems = getResponseData(data) ?? [];

  const productQueries = useQueries({
    queries: cartItems.map((item) => ({
      queryKey: ['cart-product', item.productId],
      queryFn: () => getProductById(item.productId),
      enabled: Boolean(item.productId),
    })),
  });

  const sellerIds = Array.from(new Set(cartItems.map((item) => item.sellerId)));
  const sellerQueries = useQueries({
    queries: sellerIds.map((sellerId) => ({
      queryKey: ['cart-seller', sellerId],
      queryFn: () => getSellerById(sellerId),
      enabled: Boolean(sellerId),
    })),
  });

  const sellerMap = useMemo(
    () =>
      Object.fromEntries(
        sellerIds.map((sellerId, index) => [sellerId, sellerQueries[index]?.data?.data ?? null])
      ),
    [sellerIds, sellerQueries]
  );

  const enrichedItems = cartItems.map((item, index) => {
    const product = productQueries[index]?.data?.data;
    const seller = sellerMap[item.sellerId];
    const variant = product?.variants?.find(v => v.id === item.productVariantId);

    const price = variant ? variant.price : (product?.price ?? 0);

    return {
      ...item,
      product,
      seller,
      variant,
      itemTotal: price * item.quantity,
    };
  });

  const groupedCart = useMemo(() => {
    return enrichedItems.reduce((groups, item) => {
      const existingGroup = groups[item.sellerId] || {
        sellerId: item.sellerId,
        sellerName: item.seller?.businessName || item.product?.businessName || `Studio #${item.sellerId}`,
        items: [],
        subtotal: 0,
      };

      existingGroup.items.push(item);
      existingGroup.subtotal += item.itemTotal;
      groups[item.sellerId] = existingGroup;
      return groups;
    }, {});
  }, [enrichedItems]);

  const sellerGroups = Object.values(groupedCart);
  const cartTotal = sellerGroups.reduce((sum, group) => sum + group.subtotal, 0);
  const totalItems = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);

  const removeMutation = useMutation({
    mutationFn: ({ productId, variantId }) => removeFromCart(productId, variantId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Product removed from cart.');
    },
    onError: (mutationError) => {
      toast.error(mutationError.response?.data?.message || 'Failed to remove item.');
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, variantId, desiredQuantity }) => {
      if (desiredQuantity <= 0) {
        return removeFromCart(productId, variantId);
      }

      await removeFromCart(productId, variantId);
      return addToCart({ productId, productVariantId: variantId, quantity: desiredQuantity });
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      if (variables.desiredQuantity <= 0) {
        toast.success('Product removed from cart.');
        return;
      }
    },
    onError: (mutationError) => {
      toast.error(mutationError.response?.data?.message || 'Failed to update quantity.');
    },
  });

  const isAnyProductLoading = productQueries.some((query) => query.isLoading);
  const isAnySellerLoading = sellerQueries.some((query) => query.isLoading);

  if (isLoading || isAnyProductLoading || isAnySellerLoading) {
    return <CartLoadingState />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-sand)]/10 pt-32 pb-24 px-6 flex items-center justify-center">
        <StatePanel
          className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[2rem] sm:rounded-[3rem]"
          message={(
            <div className="text-center">
              <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Failed to load cart.</p>
              <button onClick={() => refetch()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry</button>
            </div>
          )}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-sand)]/10 pb-24 pt-32 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Bag Hero */}
        <header className="mb-20">
          <Link 
            to="/discovery" 
            className="inline-flex items-center gap-3 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] hover:text-[var(--color-accent)] transition-colors group mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center group-hover:bg-[var(--color-sand)]/20 transition-all">
              <ChevronLeft size={18} />
            </div>
            Back to Marketplace
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tight">Your Cart</h1>
              <p className="mt-4 text-xl text-[var(--color-text-muted)] font-medium italic leading-relaxed">
                "Review the items in your cart before checking out."
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-6 px-10 rounded-[2.5rem] border border-white shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                <ShoppingBasket size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1">Cart Status</div>
                <div className="text-2xl font-bold text-[var(--color-primary-dark)]">{totalItems} Products</div>
              </div>
            </div>
          </div>
        </header>

        {enrichedItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <SurfaceCard className="max-w-3xl mx-auto py-24 text-center bg-white border-[var(--color-stone)]/5 shadow-2xl rounded-[2rem] sm:rounded-[4rem]">
              <div className="w-24 h-24 bg-[var(--color-sand)]/20 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-[var(--color-stone)]/5 shadow-inner text-[var(--color-primary-dark)]">
                <Package2 size={40} />
              </div>
              <h2 className="text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Your cart is empty</h2>
              <p className="text-[var(--color-text-muted)] mt-6 text-lg leading-relaxed px-12 italic">
                "You haven't added any items to your cart yet. Revisit the marketplace to discover products you love."
              </p>
              <Link
                to="/discovery"
                className="mt-12 inline-flex items-center gap-4 bg-[var(--color-primary-dark)] text-white px-12 py-6 rounded-[2rem] font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-[var(--color-primary-dark)]/20"
              >
                Browse Products
                <ArrowRight size={20} />
              </Link>
            </SurfaceCard>
          </motion.div>
        ) : (
          <div className="grid gap-12 xl:grid-cols-[1fr,420px]">
            {/* Bag Items */}
            <div className="space-y-12">
              <AnimatePresence mode="popLayout">
                {sellerGroups.map((group, groupIdx) => (
                  <motion.div 
                    key={group.sellerId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIdx * 0.1 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-4 pl-4">
                      <div className="w-12 h-12 rounded-[1.2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)] shadow-sm">
                        <Store size={22} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-[var(--color-primary-dark)]">{group.sellerName}</h2>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                          Marketplace Store • Subtotal: <span className="text-[var(--color-accent)] font-black">{formatCurrency(group.subtotal)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6">
                      {group.items.map((item, itemIdx) => {
                        const isUpdating = updateQuantityMutation.isPending && 
                                          updateQuantityMutation.variables?.productId === item.productId &&
                                          updateQuantityMutation.variables?.variantId === item.productVariantId;
                        const isRemoving = removeMutation.isPending && 
                                           removeMutation.variables?.productId === item.productId &&
                                           removeMutation.variables?.variantId === item.productVariantId;

                        return (
                          <motion.div 
                            key={`${item.productId}-${item.productVariantId}`}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                          >
                            <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-8 rounded-[3rem] group transition-all hover:shadow-2xl hover:border-[var(--color-accent)]/10">
                              <div className="flex flex-col md:flex-row gap-8">
                                {/* Product Exhibit */}
                                <div className="w-full md:w-44 aspect-square shrink-0 overflow-hidden rounded-[2rem] bg-[var(--color-sand)]/10 border border-[var(--color-stone)]/5">
                                  <SafeImage
                                    src={item.product?.images?.[0]}
                                    alt={item.product?.name}
                                    className="h-full w-full object-cover transition duration-1000 group-hover:scale-110"
                                  />
                                </div>

                                {/* Content Details */}
                                <div className="flex-1 flex flex-col justify-between py-2">
                                  <div className="flex items-start justify-between gap-6">
                                    <div className="min-w-0">
                                      <Link to={`/product/${item.productId}`}>
                                        <h3 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent)] transition-colors leading-tight truncate">{item.product?.name || `Registry #${item.productId}`}</h3>
                                      </Link>
                                      <div className="mt-3 flex flex-wrap items-center gap-4">
                                        <span className="text-xs font-bold text-[var(--color-text-muted)] italic">By {group.sellerName}</span>
                                        {item.variant && (
                                          <div className="px-3 py-1 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[8px] font-black uppercase tracking-widest rounded-lg border border-[var(--color-accent)]/10">
                                            {item.variant.label}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                          <div className={`w-1.5 h-1.5 rounded-full ${(item.variant?.stock ?? item.product?.stock) > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                                            {(item.variant?.stock ?? item.product?.stock) > 0 ? 'In Stock' : 'Out of Stock'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => removeMutation.mutate({ productId: item.productId, variantId: item.productVariantId })}
                                      disabled={isRemoving}
                                      className="w-14 h-14 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-500 transition-all hover:bg-rose-500 hover:text-white shadow-sm"
                                      title="Remove from cart"
                                    >
                                      <Trash2 size={22} />
                                    </button>
                                  </div>

                                  <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
                                    {/* Quantity Orchestrator */}
                                    <div className="flex flex-col gap-3">
                                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] pl-1">Quantity</span>
                                      <div className="flex items-center bg-[var(--color-sand)]/20 rounded-[1.5rem] border border-[var(--color-stone)]/5 p-1.5 shadow-inner">
                                        <button
                                          type="button"
                                          onClick={() => updateQuantityMutation.mutate({ productId: item.productId, variantId: item.productVariantId, desiredQuantity: item.quantity - 1 })}
                                          disabled={isUpdating || item.quantity <= 1}
                                          className="w-12 h-12 flex items-center justify-center text-[var(--color-stone)] hover:bg-white hover:text-[var(--color-primary-dark)] rounded-[1.2rem] transition-all disabled:opacity-30"
                                        >
                                          <Minus size={20} />
                                        </button>
                                        <span className="w-16 text-center text-xl font-bold text-[var(--color-primary-dark)]">
                                          {isUpdating ? <Clock size={16} className="animate-spin mx-auto opacity-30" /> : item.quantity}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => updateQuantityMutation.mutate({ productId: item.productId, variantId: item.productVariantId, desiredQuantity: item.quantity + 1 })}
                                          disabled={isUpdating || item.quantity >= (item.variant?.stock ?? item.product?.stock ?? item.quantity)}
                                          className="w-12 h-12 flex items-center justify-center text-[var(--color-stone)] hover:bg-white hover:text-[var(--color-primary-dark)] rounded-[1.2rem] transition-all disabled:opacity-30"
                                        >
                                          <Plus size={20} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Valuation Display */}
                                    <div className="text-right">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Total Price</p>
                                      <div className="flex items-baseline gap-1 text-[var(--color-primary-dark)]">
                                        <span className="text-sm font-bold text-[var(--color-accent)]">₹</span>
                                        <span className="text-4xl font-bold tracking-tighter">{item.itemTotal.toLocaleString('en-IN')}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </SurfaceCard>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary Sidebar */}
            <aside className="relative">
              <div className="sticky top-32 space-y-8">
                <SurfaceCard className="bg-[var(--color-primary-dark)] text-white border-transparent p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] sm:rounded-[4rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 blur-3xl rounded-full -mr-20 -mt-20 group-hover:bg-white/10 transition-all duration-700" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-12">
                      <div className="w-14 h-14 rounded-[1.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center text-[var(--color-accent)] shadow-xl border border-white/10">
                        <Zap size={28} />
                      </div>
                      <h2 className="text-2xl font-['Fraunces'] font-semibold">Order Summary</h2>
                    </div>

                    <div className="space-y-6">
                      <SummaryRow label="Items" value={`${totalItems} Units`} inverse />
                      <SummaryRow label="Sellers" value={`${sellerGroups.length} Stores`} inverse />
                      <SummaryRow label="Shipping" value="Calculated at checkout" inverse />
                      
                      <div className="pt-10 border-t border-white/5 mt-10">
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Order Total</span>
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-sm font-bold text-[var(--color-accent)]">INR</span>
                            <span className="text-5xl font-['Fraunces'] font-bold tracking-tighter">{formatCurrency(cartTotal).replace('₹', '')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/checkout')}
                      className="mt-12 w-full flex items-center justify-center gap-4 bg-[var(--color-accent)] text-[var(--color-primary-dark)] py-6 rounded-[2rem] font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-[var(--color-accent)]/20 group/btn"
                    >
                      Checkout
                      <ArrowRight size={22} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>

                    <div className="mt-10 p-6 rounded-[2rem] bg-white/5 border border-white/10 flex items-start gap-4">
                      <ShieldCheck size={20} className="shrink-0 text-[var(--color-accent)]" />
                      <p className="text-[10px] leading-relaxed text-white/50 font-medium uppercase tracking-wider">
                        Your transaction is secure and protected. Checkout items are grouped by store for faster shipping.
                      </p>
                    </div>
                  </div>
                </SurfaceCard>

                {/* Additional Insights */}
                <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-8 rounded-[2.5rem] shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle2 size={18} className="text-[var(--color-accent)]" />
                    <h3 className="text-sm font-bold text-[var(--color-primary-dark)] uppercase tracking-widest">Order Details</h3>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex gap-3 text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest leading-relaxed italic">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-1.5 shrink-0" />
                      Direct Seller Shipping
                    </li>
                    <li className="flex gap-3 text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest leading-relaxed italic">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-1.5 shrink-0" />
                      Quality Guaranteed
                    </li>
                  </ul>
                </SurfaceCard>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Mobile Sticky Footer */}
      {enrichedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-stone)]/5 bg-white/90 p-8 pb-12 backdrop-blur-2xl lg:hidden shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Total Price</p>
              <p className="text-3xl font-bold text-[var(--color-primary-dark)]">{formatCurrency(cartTotal)}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="flex items-center justify-center gap-3 rounded-[1.8rem] bg-[var(--color-primary-dark)] px-10 py-5 font-bold text-white shadow-2xl active:scale-95 transition-all"
            >
              Checkout
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value, inverse = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${inverse ? 'text-white/40' : 'text-[var(--color-text-muted)]'}`}>{label}</span>
      <span className={`text-sm font-bold ${inverse ? 'text-white' : 'text-[var(--color-primary-dark)]'}`}>{value}</span>
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

function CartLoadingState() {
  return (
    <div className="min-h-screen bg-[var(--color-sand)]/10 px-6 pt-32 pb-24">
      <div className="mx-auto max-w-7xl space-y-12 animate-pulse">
        <div className="h-48 w-full lg:w-2/3 bg-[var(--color-sand)]/20 rounded-[4rem]" />
        <div className="grid gap-12 xl:grid-cols-[1fr,420px]">
          <div className="space-y-10">
            <div className="h-80 w-full bg-white/50 rounded-[3rem]" />
            <div className="h-80 w-full bg-white/50 rounded-[3rem]" />
          </div>
          <div className="h-[600px] w-full bg-[var(--color-sand)]/20 rounded-[4rem]" />
        </div>
      </div>
    </div>
  );
}
