import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Boxes, 
  ChevronLeft, 
  Image as ImageIcon, 
  ShoppingBag, 
  Users, 
  Store, 
  Tag, 
  Package,
  ShieldCheck,
  LayoutGrid,
  Info,
  ArrowUpRight,
  ExternalLink,
  Eye,
  Layers,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeImage from '../../components/SafeImage';
import SurfaceCard from '../../components/SurfaceCard';
import StatusPill from '../../components/StatusPill';
import StatePanel from '../../components/StatePanel';
import { getAdminProductById } from '../../api/admin';
import { getResponseData } from '../../utils/api';
import { formatCurrency } from '../../utils/format';

export default function ProductDetails() {
  const { productId } = useParams();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: () => getAdminProductById(productId),
    enabled: Boolean(productId),
  });

  const product = getResponseData(data);

  return (
    <div className="space-y-12 pb-20">
      {/* Editorial Navigation */}
      <nav className="flex items-center justify-between">
        <Link 
          to="/admin/products" 
          className="group flex items-center gap-3 text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary-dark)] transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center shadow-sm group-hover:bg-[var(--color-sand)]/20 transition-all">
            <ChevronLeft size={18} />
          </div>
          Back to Catalog
        </Link>
      </nav>

      {isLoading ? (
        <div className="space-y-12">
          <div className="h-48 animate-pulse rounded-[3rem] bg-[var(--color-sand)]/20" />
          <div className="grid gap-12 xl:grid-cols-[1.2fr,0.8fr]">
            <div className="h-96 animate-pulse rounded-[3rem] bg-[var(--color-sand)]/20" />
            <div className="h-96 animate-pulse rounded-[3rem] bg-[var(--color-sand)]/20" />
          </div>
        </div>
      ) : error || !product ? (
        <StatePanel
          className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
          message={(
            <div className="text-center">
              <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Product exhibit not found.</p>
              <button onClick={() => refetch()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry Synchronization</button>
            </div>
          )}
        />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Exhibit Hero Card */}
          <section className="relative overflow-hidden rounded-[4rem] bg-[var(--color-primary-dark)] p-12 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative flex flex-col lg:flex-row items-center gap-10">
              <div className="w-32 h-32 rounded-[2.5rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl overflow-hidden group">
                {product.images && product.images[0] ? (
                  <SafeImage src={product.images[0]} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <Package size={48} className="text-[var(--color-accent)] opacity-30" />
                )}
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-4">
                  <h1 className="text-5xl font-['Fraunces'] font-semibold leading-tight">{product.name}</h1>
                  <StatusPill value={product.status || 'Draft'} />
                </div>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-white/60 font-medium">
                  <span className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold"><Layers size={16} className="text-[var(--color-accent)]" /> Catalog ID: {String(productId).slice(-8)}</span>
                  <span className="flex items-center gap-2"><Store size={16} /> {product.sellerName}</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-12 xl:grid-cols-[1.2fr,0.8fr]">
            {/* Media Gallery */}
            <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-12 shadow-xl rounded-[3rem]">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Media Gallery</h2>
                  <p className="mt-2 text-[var(--color-text-muted)] font-medium">A visual audit of the exhibit's digital presentation.</p>
                </div>
                <div className="w-16 h-16 rounded-[1.5rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                  <LayoutGrid size={32} />
                </div>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                {!product.images || product.images.length === 0 ? (
                  <div className="col-span-full rounded-[2.5rem] border-2 border-dashed border-[var(--color-stone)]/10 bg-[var(--color-sand)]/10 p-20 text-center">
                    <ImageIcon size={48} className="mx-auto text-[var(--color-stone)]/30 mb-6" />
                    <p className="text-lg font-medium text-[var(--color-text-muted)] italic">No visual media has been submitted for this exhibit.</p>
                  </div>
                ) : (
                  product.images.map((image, index) => (
                    <motion.div 
                      key={`${image}-${index}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="aspect-[4/3] overflow-hidden rounded-[2.5rem] bg-[var(--color-sand)]/10 border border-[var(--color-stone)]/5 group relative"
                    >
                      <SafeImage src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover transition duration-1000 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[var(--color-primary-dark)] shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                          <Eye size={20} />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </SurfaceCard>

            <aside className="space-y-12">
              {/* Valuation & Merchant */}
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 shadow-xl rounded-[3rem]">
                <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-forest-light)]/20 text-[var(--color-primary)] flex items-center justify-center">
                    <Tag size={20} />
                  </div>
                  Market Valuation
                </h3>
                
                <div className="space-y-6">
                  <MetricCard label="Current Listing Price" value={formatCurrency(product.price)} accent="terracotta" />
                  <MetricCard label="Available Inventory" value={`${product.stock} Artisan Units`} accent="forest" />
                </div>

                <div className="mt-10 border-t border-[var(--color-stone)]/5 pt-10">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-4">Origin Studio</div>
                  <Link 
                    to={`/admin/sellers/${product.sellerId}`}
                    className="flex items-center justify-between p-6 rounded-2xl bg-[var(--color-sand)]/20 hover:bg-[var(--color-accent)] hover:text-white transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[var(--color-primary-dark)] shadow-inner group-hover:scale-110 transition-transform">
                        <Store size={20} />
                      </div>
                      <span className="font-bold text-lg">{product.sellerName}</span>
                    </div>
                    <ArrowUpRight size={20} className="opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0" />
                  </Link>
                </div>
              </SurfaceCard>

              {/* Contextual Narrative */}
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 shadow-xl rounded-[3rem]">
                <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Info size={20} />
                  </div>
                  Exhibit Narrative
                </h3>
                <div className="p-8 rounded-[2rem] bg-[var(--color-sand)]/10 border border-[var(--color-stone)]/5 italic leading-relaxed text-[var(--color-primary-dark)] font-medium">
                  "{product.description || 'The merchant has not provided a curated description for this exhibit.'}"
                </div>

                {product.rejectionReason && (
                  <div className="mt-8 p-6 rounded-2xl bg-rose-50 border border-rose-100">
                    <div className="flex items-center gap-2 text-rose-600 text-[10px] font-bold uppercase tracking-widest mb-3">
                      <History size={14} /> Audit Note
                    </div>
                    <p className="text-sm text-rose-800/80 italic leading-relaxed font-bold">
                      "{product.rejectionReason}"
                    </p>
                  </div>
                )}
              </SurfaceCard>
            </aside>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MetricCard({ label, value, accent }) {
  const accents = {
    terracotta: 'text-[var(--color-accent)] bg-[var(--color-sand)]/30',
    forest: 'text-[var(--color-primary)] bg-[var(--color-forest-light)]/30',
  };

  return (
    <div className="p-6 rounded-[2rem] bg-[var(--color-sand)]/10 border border-[var(--color-stone)]/5 transition-all hover:bg-white hover:shadow-lg group">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">{label}</div>
      <div className={`text-2xl font-bold tracking-tight transition-transform group-hover:translate-x-1 ${accents[accent] || ''} inline-block px-3 py-1 rounded-xl`}>
        {value}
      </div>
    </div>
  );
}




