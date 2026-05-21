import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ShoppingBasket,
  Clock,
  Heart,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCart, removeFromCart, addToCart } from '../api/customer';
import { getProductById } from '../api/marketplace';
import SafeImage from './SafeImage';
import { getResponseData } from '../utils/api';
import { formatCurrency } from '../utils/format';
import { useToast } from '../hooks/useToast';

export default function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: isOpen,
  });

  const cartItems = getResponseData(data) ?? [];

  const productQueries = useQueries({
    queries: cartItems.map((item) => ({
      queryKey: ['cart-product', item.productId],
      queryFn: () => getProductById(item.productId),
      enabled: isOpen && Boolean(item.productId),
    })),
  });

  const enrichedItems = cartItems.map((item, index) => {
    const product = productQueries[index]?.data?.data;
    const variant = product?.variants?.find(v => v.id === item.productVariantId);
    const price = variant ? variant.price : (product?.price ?? 0);
    return {
      ...item,
      product,
      variant,
      itemTotal: price * item.quantity,
    };
  });

  const subtotal = enrichedItems.reduce((acc, item) => acc + item.itemTotal, 0);

  const removeMutation = useMutation({
    mutationFn: ({ productId, variantId }) => removeFromCart(productId, variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Removed from selection.');
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ productId, quantity, variantId }) => addToCart({ productId, quantity, productVariantId: variantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        />

        {/* Drawer Content */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute top-0 right-0 h-full w-full max-w-md bg-[var(--color-background)] border-l border-[var(--color-stone)]/10 shadow-2xl pointer-events-auto flex flex-col paper-texture"
        >
          {/* Header */}
          <div className="p-8 flex items-center justify-between border-b border-[var(--color-stone)]/10">
            <div>
              <h2 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Your Selection</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-stone)]/50 mt-1">Gourmet Heritage Provisions</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-[var(--color-sand)]/20 text-[var(--color-primary-dark)] hover:bg-[var(--color-accent)] hover:text-white transition-all">
              <X size={20} />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
            {enrichedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <ShoppingBag size={48} className="mb-6 text-[var(--color-stone)]" />
                <p className="font-['Fraunces'] text-xl font-semibold text-[var(--color-primary-dark)]">Selection is empty</p>
                <p className="text-xs italic mt-2">"Discover artisanal provisions to fill your pantry."</p>
              </div>
            ) : (
              enrichedItems.map((item) => (
                <div key={`${item.productId}-${item.productVariantId}`} className="flex gap-6 group">
                  <div className="w-24 h-32 overflow-hidden bg-[var(--color-sand)]/20 border border-[var(--color-stone)]/5 shrink-0">
                    <SafeImage src={item.product?.imageUrl} alt={item.product?.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 py-1 flex flex-col">
                    <div className="flex justify-between gap-4 mb-2">
                      <h4 className="font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors cursor-pointer" onClick={() => { navigate(`/product/${item.productId}`); onClose(); }}>
                        {item.product?.name}
                      </h4>
                      <button 
                        onClick={() => removeMutation.mutate({ productId: item.productId, variantId: item.productVariantId })}
                        className="text-[var(--color-stone)] hover:text-rose-500 transition-colors shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {item.variant && (
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)] mb-2">{item.variant.name}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center bg-white border border-[var(--color-stone)]/10 p-1 shadow-sm">
                        <button 
                          onClick={() => updateQuantityMutation.mutate({ productId: item.productId, quantity: item.quantity - 1, variantId: item.productVariantId })}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center text-[var(--color-stone)] hover:text-[var(--color-primary-dark)] disabled:opacity-20"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-[var(--color-primary-dark)]">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantityMutation.mutate({ productId: item.productId, quantity: item.quantity + 1, variantId: item.productVariantId })}
                          className="w-7 h-7 flex items-center justify-center text-[var(--color-stone)] hover:text-[var(--color-primary-dark)]"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">
                        {formatCurrency(item.itemTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Navigation (As per image) */}
          <div className="p-8 bg-white/50 backdrop-blur-md border-t border-[var(--color-stone)]/10 space-y-1">
             <DrawerNavButton icon={<ShoppingBasket size={18} />} label="Basket" count={enrichedItems.length} active onClick={() => { navigate('/cart'); onClose(); }} />
             <DrawerNavButton icon={<Clock size={18} />} label="Recently Viewed" onClick={() => { navigate('/discovery'); onClose(); }} />
             <DrawerNavButton icon={<Heart size={18} />} label="Saved" onClick={() => { navigate('/wishlist'); onClose(); }} />
             <DrawerNavButton icon={<HelpCircle size={18} />} label="Support" onClick={() => { toast.info('Our concierges are ready to assist you.'); }} />
          </div>

          {/* Checkout Block */}
          <div className="p-8 bg-white border-t border-[var(--color-stone)]/10">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-stone)]">Subtotal</span>
              <span className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">{formatCurrency(subtotal)}</span>
            </div>
            <button 
              onClick={() => { navigate('/checkout'); onClose(); }}
              className="w-full py-5 bg-[var(--color-primary-dark)] text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-[var(--color-primary)]/20 flex items-center justify-center gap-3 hover:bg-[var(--color-primary-light)] transition-all transform active:scale-[0.98]"
            >
              Checkout Now <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function DrawerNavButton({ icon, label, count, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 transition-all ${active ? 'bg-emerald-100/50 text-[var(--color-primary-dark)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-sand)]/20'}`}
    >
      <div className={`${active ? 'text-emerald-700' : 'text-[var(--color-stone)]/60'}`}>
        {icon}
      </div>
      <span className="flex-1 text-left text-sm font-bold">{label}</span>
      {count !== undefined && (
        <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}
