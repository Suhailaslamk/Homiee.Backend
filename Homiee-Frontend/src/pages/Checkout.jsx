import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Plus,
  Store,
  Sparkles,
  ShieldCheck,
  Gift,
  PenTool,
  MessageSquare,
  Lock,
  ArrowRight,
  Truck,
  Zap,
  Info,
  ChevronLeft,
  Search,
  Package,

  ChevronRight,
  PlusCircle,
  X,
  User,
  Smartphone,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  checkoutFromCart,
  createAddress,
  getAddresses,
  getCart,
} from '../api/customer';
import { getProductById, getSellerById } from '../api/marketplace';
import SurfaceCard from '../components/SurfaceCard';
import { useToast } from '../hooks/useToast';
import { getResponseData } from '../utils/api';

const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  line1: '',
  city: '',
  state: '',
  pincode: '',
};

export default function Checkout() {
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressDraft, setAddressDraft] = useState(EMPTY_ADDRESS);
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState('');

  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: cartResponse, isLoading: cartLoading, error: cartError, refetch: refetchCart } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
  });

  const { data: addressesResponse, isLoading: addressesLoading, error: addressesError, refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
  });

  const cartItems = getResponseData(cartResponse) ?? [];
  const addresses = getResponseData(addressesResponse) ?? [];

  const productQueries = useQueries({
    queries: cartItems.map((item) => ({
      queryKey: ['checkout-product', item.productId],
      queryFn: () => getProductById(item.productId),
      enabled: Boolean(item.productId),
    })),
  });

  const sellerIds = Array.from(new Set(cartItems.map((item) => item.sellerId)));
  const sellerQueries = useQueries({
    queries: sellerIds.map((sellerId) => ({
      queryKey: ['checkout-seller', sellerId],
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

    return {
      ...item,
      product,
      seller,
      itemTotal: (product?.price ?? 0) * item.quantity,
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
  const subtotal = sellerGroups.reduce((sum, group) => sum + group.subtotal, 0);

  const createAddressMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setAddressDraft(EMPTY_ADDRESS);
      setShowAddressForm(false);
      toast.success('Destination registry updated.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to update registry.');
    },
  });

  const codCheckoutMutation = useMutation({
    mutationFn: checkoutFromCart,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Acquisition cycle initiated successfully.');
      navigate('/success');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to initiate cycle.');
    },
  });



  const isAnyProductLoading = productQueries.some((query) => query.isLoading);
  const isAnySellerLoading = sellerQueries.some((query) => query.isLoading);

  if (cartLoading || addressesLoading || isAnyProductLoading || isAnySellerLoading) {
    return <CheckoutLoadingState />;
  }

  if (cartError || addressesError) {
    return (
      <div className="min-h-screen bg-[var(--color-sand)]/10 pt-32 pb-24 px-6 flex items-center justify-center">
        <StatePanel
          className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
          message={(
            <div className="text-center">
              <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Unable to sync checkout parameters.</p>
              <button onClick={() => { refetchCart(); refetchAddresses(); }} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry Synchronization</button>
            </div>
          )}
        />
      </div>
    );
  }

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      toast.error('Please specify a delivery destination registry.');
      return;
    }

    codCheckoutMutation.mutate({ 
      addressId: selectedAddressId,
      requestedDeliveryDate: requestedDeliveryDate || null 
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-sand)]/10 pb-24 pt-32 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Concierge Hero */}
        <header className="mb-20">
          <Link 
            to="/cart" 
            className="inline-flex items-center gap-3 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] hover:text-[var(--color-accent)] transition-colors group mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center group-hover:bg-[var(--color-sand)]/20 transition-all">
              <ChevronLeft size={18} />
            </div>
            Back to Acquisition Bag
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tight">Concierge Settlement</h1>
              <p className="mt-4 text-xl text-[var(--color-text-muted)] font-medium italic leading-relaxed">
                "Orchestrating the final transition of your chosen pieces to their destined environment."
              </p>
            </div>
            <div className="flex items-center gap-4 bg-[var(--color-primary-dark)] text-white p-6 px-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-[var(--color-accent)]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Security Protocol</div>
                  <div className="text-lg font-bold">Encrypted Settlement</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-12 xl:grid-cols-[1fr,450px]">
          {/* Main Orchestration */}
          <div className="space-y-12">
            {/* Delivery Registry */}
            <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-12 rounded-[4rem] shadow-xl">
              <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--color-primary-dark)]">Destination Registry</h2>
                    <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1">Specify where your pieces shall arrive</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className={`px-8 py-4 rounded-[1.5rem] font-bold text-sm transition-all flex items-center gap-2 ${showAddressForm ? 'bg-[var(--color-sand)]/20 text-[var(--color-stone)]' : 'bg-[var(--color-primary-dark)] text-white shadow-xl'}`}
                >
                  {showAddressForm ? <X size={18} /> : <PlusCircle size={18} />}
                  {showAddressForm ? 'Discard Entry' : 'Register Destination'}
                </button>
              </div>

              <AnimatePresence>
                {showAddressForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={(e) => { e.preventDefault(); createAddressMutation.mutate(addressDraft); }}
                    className="mb-12 grid gap-8 overflow-hidden"
                  >
                    <div className="grid gap-6 md:grid-cols-2 p-10 rounded-[3rem] bg-[var(--color-sand)]/10 border border-[var(--color-stone)]/5 shadow-inner">
                      <InputField label="Recipient Designation" value={addressDraft.fullName} onChange={(v) => setAddressDraft({ ...addressDraft, fullName: v })} icon={<User size={18} />} />
                      <InputField label="Secure Contact" value={addressDraft.phone} onChange={(v) => setAddressDraft({ ...addressDraft, phone: v })} icon={<Smartphone size={18} />} />
                      <div className="md:col-span-2">
                        <InputField label="Street Origin" value={addressDraft.line1} onChange={(v) => setAddressDraft({ ...addressDraft, line1: v })} icon={<MapPin size={18} />} />
                      </div>
                      <InputField label="City Centre" value={addressDraft.city} onChange={(v) => setAddressDraft({ ...addressDraft, city: v })} />
                      <InputField label="Region / State" value={addressDraft.state} onChange={(v) => setAddressDraft({ ...addressDraft, state: v })} />
                      <InputField label="Pincode Ledger" value={addressDraft.pincode} onChange={(v) => setAddressDraft({ ...addressDraft, pincode: v })} />
                      <div className="md:col-span-2">
                        <button type="submit" disabled={createAddressMutation.isPending} className="w-full h-16 rounded-[1.5rem] bg-[var(--color-primary-dark)] text-white font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                          {createAddressMutation.isPending ? 'Syncing Registry...' : 'Register to Dossier'}
                        </button>
                      </div>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="grid gap-6">
                {addresses.length === 0 ? (
                  <div className="text-center py-16 rounded-[3rem] border-2 border-dashed border-[var(--color-stone)]/10 text-[var(--color-text-muted)] font-medium italic">
                    "The destination registry is currently quiescent. Please add a registry entry."
                  </div>
                ) : (
                  addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`relative w-full rounded-[2.5rem] border-2 p-8 text-left transition-all duration-500 group ${
                          isSelected 
                            ? 'border-[var(--color-accent)] bg-white shadow-2xl scale-[1.02]' 
                            : 'border-transparent bg-[var(--color-sand)]/10 hover:bg-white hover:border-[var(--color-accent)]/20'
                        }`}
                      >
                        <div className="flex items-start gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--color-primary-dark)] text-[var(--color-accent)] shadow-xl rotate-12' : 'bg-white text-[var(--color-stone)] shadow-sm'}`}>
                            <MapPin size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xl font-bold text-[var(--color-primary-dark)]">{addr.fullName}</p>
                            <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1 italic">{addr.phone}</p>
                            <p className="mt-4 text-sm leading-relaxed text-[var(--color-stone)] font-medium italic pr-12">
                              {addr.line1}, {addr.city}, {addr.state} — {addr.pincode}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-8 right-8">
                              <CheckCircle2 className="text-[var(--color-accent)]" size={32} />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </SurfaceCard>

            {/* Gift Personalization */}
            <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-12 rounded-[4rem] shadow-xl">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-[1.2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                  <Gift size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--color-primary-dark)]">Gift Curation</h2>
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1">Enhance the emotional resonance of your piece</p>
                </div>
              </div>

              <div className="space-y-8">
                <button 
                  onClick={() => setIsGift(!isGift)}
                  className={`w-full flex items-center justify-between p-8 rounded-[2.5rem] border-2 transition-all group ${isGift ? 'border-[var(--color-accent)] bg-white shadow-xl' : 'border-transparent bg-[var(--color-sand)]/10 hover:bg-white hover:border-[var(--color-accent)]/20'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${isGift ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-stone)]/10 bg-white group-hover:border-[var(--color-accent)]/30'}`}>
                      {isGift && <CheckCircle2 size={18} className="text-white" />}
                    </div>
                    <span className="text-lg font-bold text-[var(--color-primary-dark)]">Orchestrate as a gift for someone special</span>
                  </div>
                  <Sparkles size={24} className={isGift ? 'text-[var(--color-accent)]' : 'text-[var(--color-stone)]/20'} />
                </button>

                <AnimatePresence>
                  {isGift && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="relative group">
                        <textarea 
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          placeholder="Compose a handwritten message for your piece..."
                          className="w-full h-40 rounded-[2rem] border-2 border-[var(--color-stone)]/5 bg-[var(--color-sand)]/5 p-8 outline-none focus:bg-white focus:border-[var(--color-accent)]/20 transition-all italic text-xl shadow-inner placeholder:text-[var(--color-stone)]/30"
                          style={{ fontFamily: 'Georgia, serif' }}
                        />
                        <div className="absolute bottom-6 right-8 flex items-center gap-3 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest italic opacity-50">
                          Handwritten Transcription <PenTool size={14} />
                        </div>
                      </div>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-medium text-center italic">
                        "Your message will be hand-transcribed on artisan-grade recycled cardstock."
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </SurfaceCard>

            {/* Delivery Timeline */}
            <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-12 rounded-[4rem] shadow-xl">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-[1.2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                  <Clock size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--color-primary-dark)]">Delivery Timeline</h2>
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1">Schedule your piece's arrival</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-sm text-[var(--color-text-muted)] italic leading-relaxed">
                  "Choose a preferred date for your pieces to arrive. We will orchestrate our logistics to honor your schedule."
                </p>
                <div className="relative group max-w-sm">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-stone)] group-focus-within:text-[var(--color-accent)] transition-colors pointer-events-none">
                    <Clock size={20} />
                  </div>
                  <input 
                    type="date"
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Min is tomorrow
                    value={requestedDeliveryDate}
                    onChange={(e) => setRequestedDeliveryDate(e.target.value)}
                    className="w-full pl-16 pr-8 py-5 bg-[var(--color-sand)]/10 border-2 border-transparent rounded-[1.5rem] text-[var(--color-primary-dark)] font-bold outline-none transition-all shadow-inner focus:bg-white focus:border-[var(--color-accent)]/20"
                  />
                </div>
                {requestedDeliveryDate && (
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={12} /> Scheduled for {new Date(requestedDeliveryDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
            </SurfaceCard>

            {/* Payment Method - Static Info */}
            <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-12 rounded-[4rem] shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1.2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                  <Wallet size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--color-primary-dark)]">Settlement Protocol</h2>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Verified: Cash on Delivery only</p>
                </div>
              </div>
              <p className="mt-6 text-sm text-[var(--color-text-muted)] italic leading-relaxed">
                "For artisan integrity and logistical simplicity, all transactions are settled via Studio Settlement (COD) upon the successful arrival of your pieces."
              </p>
            </SurfaceCard>
          </div>

          {/* Settlement Summary */}
          <aside className="relative">
            <div className="sticky top-32 space-y-8">
              <SurfaceCard className="bg-[var(--color-primary-dark)] text-white p-10 rounded-[4rem] shadow-[0_30px_60px_rgba(0,0,0,0.15)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-3xl rounded-full -mr-24 -mt-24 group-hover:bg-white/10 transition-all duration-1000" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 rounded-[1.8rem] bg-white/10 backdrop-blur-md flex items-center justify-center text-[var(--color-accent)] shadow-2xl border border-white/10">
                      <Sparkles size={28} />
                    </div>
                    <h2 className="text-2xl font-['Fraunces'] font-semibold">Order Vault</h2>
                  </div>

                  <div className="space-y-6 max-h-[350px] overflow-y-auto pr-4 scrollbar-hide">
                    {sellerGroups.map((group) => (
                      <div key={group.sellerId} className="p-6 rounded-[2rem] bg-white/5 border border-white/5">
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] truncate">{group.sellerName}</span>
                          <span className="text-xs font-bold text-[var(--color-accent)]">{formatCurrency(group.subtotal)}</span>
                        </div>
                        <div className="space-y-3">
                          {group.items.map((item) => (
                            <div key={item.productId} className="flex justify-between items-start gap-4 text-[10px] font-medium text-white/30 italic leading-relaxed">
                              <span className="truncate flex-1">{item.product?.name} <span className="text-white/10">×</span> {item.quantity}</span>
                              <span className="text-white/40">{formatCurrency(item.itemTotal)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 pt-10 border-t border-white/5 space-y-6">
                    <SummaryRow label="Subtotal Valuation" value={formatCurrency(subtotal)} inverse />
                    <SummaryRow label="Concierge Logistics" value="INCLUDED" inverse />
                    
                    <div className="pt-8 border-t border-white/10 mt-8">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Total Transaction Investment</span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-bold text-[var(--color-accent)]">INR</span>
                          <span className="text-5xl font-['Fraunces'] font-bold tracking-tighter">{formatCurrency(subtotal).replace('₹', '')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                    <button
                      onClick={handlePlaceOrder}
                      disabled={!selectedAddressId || codCheckoutMutation.isPending}
                      className="mt-12 w-full h-20 rounded-[2rem] bg-[var(--color-accent)] text-[var(--color-primary-dark)] font-bold text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-[var(--color-accent)]/20 flex items-center justify-center gap-4 group/btn"
                    >
                      {codCheckoutMutation.isPending ? (
                        <><Clock size={24} className="animate-spin" /> Orchestrating...</>
                      ) : (
                      <>Confirm Acquisition <ArrowRight size={24} className="group-hover/btn:translate-x-2 transition-transform" /></>
                    )}
                  </button>
                </div>
              </SurfaceCard>

              <div className="p-6 rounded-[2.5rem] bg-white border border-[var(--color-stone)]/5 shadow-xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)] shrink-0 shadow-inner">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-primary-dark)] uppercase tracking-widest mb-1">Guaranteed Integrity</h4>
                  <p className="text-[10px] leading-relaxed text-[var(--color-text-muted)] font-medium italic">
                    "Every transaction is encrypted and verified through the Homiee secure settlement protocol."
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, icon }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] pl-2">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-stone)] group-focus-within:text-[var(--color-accent)] transition-colors">
            {icon}
          </div>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${icon ? 'pl-14' : 'px-6'} py-5 bg-white border-2 border-transparent rounded-[1.5rem] text-[var(--color-primary-dark)] font-bold outline-none transition-all shadow-sm focus:border-[var(--color-accent)]/20 focus:ring-4 focus:ring-[var(--color-accent)]/5`}
        />
      </div>
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

function CheckoutLoadingState() {
  return (
    <div className="min-h-screen bg-[var(--color-sand)]/10 pb-24 pt-32 px-6">
      <div className="mx-auto max-w-7xl space-y-12 animate-pulse">
        <div className="h-48 w-full lg:w-2/3 bg-[var(--color-sand)]/20 rounded-[4rem]" />
        <div className="grid gap-12 xl:grid-cols-[1fr,450px]">
          <div className="space-y-12">
            <div className="h-[400px] w-full bg-white rounded-[4rem]" />
            <div className="h-64 w-full bg-white rounded-[4rem]" />
          </div>
          <div className="h-[600px] w-full bg-[var(--color-sand)]/20 rounded-[4rem]" />
        </div>
      </div>
    </div>
  );
}
