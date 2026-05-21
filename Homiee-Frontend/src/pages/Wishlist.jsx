import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Heart, 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  ArrowUpRight,
  PlusCircle,
  Clock,
  Layers,
  ShoppingBasket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWishlist, removeFromWishlist, addToCart } from '../api/customer';
import { getResponseData } from '../utils/api';
import { useToast } from '../hooks/useToast';
import SafeImage from '../components/SafeImage';
import SurfaceCard from '../components/SurfaceCard';

export default function Wishlist() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
  });

  const wishlist = getResponseData(data) || [];

  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Item removed from wishlist.');
    },
    onError: () => toast.error('Failed to remove item.'),
  });

  const moveToCartMutation = useMutation({
    mutationFn: async (product) => {
      await addToCart({ productId: product.id, quantity: 1 });
      await removeFromWishlist(product.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item added to cart.');
    },
    onError: () => toast.error('Failed to add to cart.'),
  });

  return (
    <div className="min-h-screen bg-[var(--color-sand)]/10 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* Vault Hero */}
        <header className="mb-20 text-center relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-primary-dark)] text-white text-[10px] font-bold uppercase tracking-[0.3em] mb-6 shadow-xl"
          >
            <Sparkles size={14} className="text-[var(--color-accent)]" />
            My Wishlist
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tight"
          >
            Your Saved Products
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-[var(--color-text-muted)] font-medium max-w-2xl mx-auto italic leading-relaxed px-6"
          >
            "Save products you love and add them to your cart whenever you're ready."
          </motion.p>
        </header>

        {isLoading ? (
          <WishlistLoading />
        ) : wishlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <SurfaceCard className="max-w-3xl mx-auto py-24 text-center bg-white border-[var(--color-stone)]/5 shadow-2xl rounded-[2rem] sm:rounded-[4rem]">
              <div className="w-24 h-24 bg-[var(--color-sand)]/20 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-[var(--color-stone)]/5 shadow-inner text-[var(--color-primary-dark)]">
                <Heart size={40} />
              </div>
              <h2 className="text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Your wishlist is empty</h2>
              <p className="text-[var(--color-text-muted)] mt-6 text-lg leading-relaxed px-12 italic">
                You haven't saved any items yet. Explore the marketplace to discover products you love.
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
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {wishlist.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <WishlistItem 
                    item={item} 
                    onRemove={() => removeMutation.mutate(item.id)}
                    onMoveToCart={() => moveToCartMutation.mutate(item)}
                    isMoving={moveToCartMutation.isPending && Number(moveToCartMutation.variables?.id) === Number(item.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function WishlistItem({ item, onRemove, onMoveToCart, isMoving }) {
  return (
    <SurfaceCard className="group flex flex-col bg-white rounded-[2rem] sm:rounded-[3.5rem] border-[var(--color-stone)]/5 overflow-hidden hover:shadow-2xl hover:border-[var(--color-accent)]/20 transition-all duration-700 p-0">
      <div className="relative aspect-[4/5] overflow-hidden">
        <SafeImage 
          src={item.image || item.images?.[0]} 
          alt={item.name} 
          className="w-full h-full object-cover transition duration-1000 group-hover:scale-110"
        />
        
        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[2px] flex items-center justify-center gap-4">
          <button 
            onClick={onRemove}
            className="w-14 h-14 bg-white/20 hover:bg-rose-500/80 backdrop-blur-md text-white rounded-2xl flex items-center justify-center transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 delay-75 shadow-xl border border-white/20"
            title="Remove from wishlist"
          >
            <Trash2 size={22} />
          </button>
          <Link 
            to={`/product/${item.id}`}
            className="w-14 h-14 bg-white/20 hover:bg-[var(--color-accent)]/80 backdrop-blur-md text-white rounded-2xl flex items-center justify-center transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 shadow-xl border border-white/20"
            title="View details"
          >
            <ArrowUpRight size={22} />
          </Link>
        </div>

        {/* Collection Label */}
        <div className="absolute bottom-6 left-6">
          <span className="px-5 py-2 bg-white/80 backdrop-blur-md rounded-full text-[10px] font-bold text-[var(--color-primary-dark)] uppercase tracking-widest border border-white/50 shadow-sm">
            {item.categoryName || 'Product'}
          </span>
        </div>
      </div>

      <div className="p-10 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">{item.name}</h3>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Price</span>
              <div className="flex items-baseline gap-1 text-[var(--color-primary-dark)]">
                <span className="text-sm font-bold text-[var(--color-accent)]">₹</span>
                <span className="text-3xl font-bold tracking-tighter">{item.price?.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-sand)]/20 flex items-center justify-center text-[var(--color-primary-dark)]/30 group-hover:text-[var(--color-accent)] transition-colors">
              <Layers size={20} />
            </div>
          </div>
        </div>

        <button 
          onClick={onMoveToCart}
          disabled={isMoving}
          className="mt-8 sm:mt-10 w-full flex items-center justify-center gap-3 bg-[var(--color-primary-dark)] text-white py-4 sm:py-6 rounded-[2rem] font-bold hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all shadow-xl shadow-[var(--color-primary-dark)]/10"
        >
          {isMoving ? <Clock size={20} className="animate-spin" /> : <ShoppingBag size={20} />}
          Add to Cart
        </button>
      </div>
    </SurfaceCard>
  );
}

function WishlistLoading() {
  return (
    <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex flex-col bg-white/50 rounded-[3.5rem] border border-[var(--color-stone)]/5 overflow-hidden animate-pulse">
          <div className="aspect-[4/5] bg-[var(--color-sand)]/20" />
          <div className="p-10 space-y-6">
            <div className="h-8 w-3/4 bg-[var(--color-sand)]/30 rounded-xl" />
            <div className="h-12 w-1/2 bg-[var(--color-sand)]/30 rounded-xl" />
            <div className="h-16 w-full bg-[var(--color-sand)]/30 rounded-[2rem] mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
