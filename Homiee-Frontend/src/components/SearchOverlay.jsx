import React from 'react';
import { Search, X, ArrowUpRight, Store, Package, History, TrendingUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getProducts, getStores } from '../api/marketplace';
import { Link } from 'react-router-dom';
import { getResponseData, getPagedItems } from '../utils/api';
import { formatCurrency } from '../utils/format';
import SafeImage from './SafeImage';

export default function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: productResponse, isLoading: productLoading } = useQuery({
    queryKey: ['search-products', debouncedQuery],
    queryFn: () => getProducts({ search: debouncedQuery, pageSize: 5 }),
    enabled: debouncedQuery.length > 1,
  });

  const { data: storeResponse, isLoading: storeLoading } = useQuery({
    queryKey: ['search-stores', debouncedQuery],
    queryFn: () => getStores({ search: debouncedQuery, pageSize: 3 }),
    enabled: debouncedQuery.length > 1,
  });

  const products = getPagedItems(productResponse);
  const stores = getPagedItems(storeResponse);
  const isSearching = productLoading || storeLoading;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[var(--color-primary-dark)]/10 backdrop-blur-md flex items-start justify-center pt-24 px-4"
        >
          <motion.div 
            initial={{ y: -20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.98 }}
            className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden border border-[var(--color-stone)]/10"
          >
            {/* SEARCH INPUT */}
            <div className="relative border-b border-[var(--color-stone)]/5">
              <Search size={20} className="absolute left-8 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input 
                autoFocus
                placeholder="Find treasures, artisans, or stories..."
                className="w-full py-8 pl-16 pr-20 text-xl font-medium outline-none placeholder:text-[var(--color-stone)]/40"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4">
                {isSearching && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full"
                  />
                )}
                <button 
                  onClick={onClose}
                  className="p-1.5 hover:bg-[var(--color-sand)]/50 rounded-lg text-[var(--color-text-muted)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* RESULTS AREA */}
            <div className="max-h-[60vh] overflow-y-auto p-4 no-scrollbar">
              {debouncedQuery.length <= 1 ? (
                <div className="p-8 space-y-10">
                  <div>
                    <SectionHeader icon={Sparkles} title="Recommended Discoveries" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      {['Handcrafted Pottery', 'Organic Linen', 'Vintage Watches', 'Minimalist Jewelry'].map(tag => (
                        <button 
                          key={tag}
                          onClick={() => setQuery(tag)}
                          className="flex items-center gap-3 p-4 bg-[var(--color-sand)]/20 hover:bg-[var(--color-sand)]/40 rounded-2xl text-sm font-bold text-[var(--color-primary-dark)] transition-colors"
                        >
                          <TrendingUp size={14} className="text-[var(--color-accent)]" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                    <History size={12} />
                    Press Esc to close
                  </div>
                </div>
              ) : (
                <div className="space-y-8 p-4">
                  {/* PRODUCTS */}
                  {products.length > 0 && (
                    <div>
                      <SectionHeader icon={Package} title="Treasures" />
                      <div className="space-y-2 mt-4">
                        {products.map(p => (
                          <Link 
                            key={p.id} 
                            to={`/product/${p.id}`} 
                            onClick={onClose}
                            className="flex items-center justify-between p-4 hover:bg-[var(--color-sand)]/20 rounded-2xl transition-colors group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-[var(--color-sand)]/30 rounded-xl overflow-hidden shrink-0">
                                <SafeImage src={p.images?.[0] || p.imageUrl || p.image} alt={p.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-bold text-[var(--color-primary-dark)] group-hover:text-[var(--color-primary)] transition-colors">{p.name}</p>
                                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{p.categoryName || 'Product'}</p>
                              </div>
                            </div>
                            <span className="font-bold text-[var(--color-primary)]">
                              {formatCurrency(p.price)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STORES */}
                  {stores.length > 0 && (
                    <div>
                      <SectionHeader icon={Store} title="Artisans" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {stores.map(s => (
                          <Link 
                            key={s.sellerId || s.id} 
                            to={`/store/${s.sellerId || s.id}`} 
                            onClick={onClose}
                            className="flex items-center gap-4 p-4 bg-[var(--color-primary-dark)] text-white rounded-2xl hover:bg-[var(--color-primary)] transition-colors"
                          >
                            <div className="w-10 h-10 bg-white/10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-lg font-bold font-['Fraunces'] text-[var(--color-accent)]">
                              {s.businessName?.[0] || 'A'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold truncate text-sm">{s.businessName}</p>
                              <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">{s.categoryName || 'Artisan'}</p>
                            </div>
                            <ArrowUpRight size={16} className="ml-auto text-white/40" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {products.length === 0 && stores.length === 0 && !isSearching && (
                    <div className="p-12 text-center text-[var(--color-text-muted)]">
                      <p className="font-bold text-lg text-[var(--color-primary-dark)]">No results found for "{debouncedQuery}"</p>
                      <p className="mt-2 text-sm font-medium">Try searching for broader terms or categories.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FOOTER TIPS */}
            <div className="bg-[var(--color-sand)]/10 p-4 flex items-center justify-center gap-8 border-t border-[var(--color-stone)]/5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <span className="px-1.5 py-0.5 rounded border border-[var(--color-stone)]/20 bg-white">↑↓</span> to navigate
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <span className="px-1.5 py-0.5 rounded border border-[var(--color-stone)]/20 bg-white">Enter</span> to select
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 text-slate-400">
    <Icon size={18} />
    <span className="text-xs font-black uppercase tracking-[0.2em]">{title}</span>
  </div>
);
