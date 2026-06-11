import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Boxes, 
  ChevronLeft, 
  FileCheck2, 
  MapPin, 
  Phone, 
  ShoppingBag, 
  Users, 
  ExternalLink, 
  Mail,
  Store,
  FileText,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Globe,
  Briefcase,
  IdCard,
  History,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SurfaceCard from '../../components/SurfaceCard';
import StatusPill from '../../components/StatusPill';
import StatePanel from '../../components/StatePanel';
import { approveSeller, getAdminSellerById, rejectSeller } from '../../api/admin';
import { getResponseData } from '../../utils/api';
import { useToast } from '../../hooks/useToast';

export default function SellerDetails() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { userId } = useParams();
  const [showRejectModal, setShowRejectModal] = React.useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-seller', userId],
    queryFn: () => getAdminSellerById(userId),
    enabled: Boolean(userId),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveSeller(userId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      toast.success(response.message || 'Seller approved successfully.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to approve seller.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason) => rejectSeller(userId, reason),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      toast.success(response.message || 'Seller application rejected.');
      setShowRejectModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to reject application.');
    },
  });

  const sanitizeDocUrl = (url) => {
    if (!url) return '#';
    
    // If it's a local filesystem URL from the fallback service
    if (url.startsWith('/uploads')) {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const baseOrigin = apiBase.replace(/\/api\/?$/, '');
      return `${baseOrigin}${url}`;
    }

    try {
      return url.split('?')[0];
    } catch {
      return url;
    }
  };

  const seller = getResponseData(data);

  return (
    <div className="space-y-12 pb-20">
      {/* Editorial Navigation */}
      <nav className="flex items-center justify-between">
        <Link 
          to="/admin/sellers" 
          className="group flex items-center gap-3 text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary-dark)] transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center shadow-sm group-hover:bg-[var(--color-sand)]/20 transition-all">
            <ChevronLeft size={18} />
          </div>
          Back to Directory
        </Link>
      </nav>

      {isLoading ? (
        <div className="space-y-12">
          <div className="h-48 animate-pulse rounded-[3rem] bg-[var(--color-sand)]/20" />
          <div className="grid gap-12 lg:grid-cols-[1fr,400px]">
            <div className="h-96 animate-pulse rounded-[3rem] bg-[var(--color-sand)]/20" />
            <div className="h-96 animate-pulse rounded-[3rem] bg-[var(--color-sand)]/20" />
          </div>
        </div>
      ) : error || !seller ? (
        <StatePanel
          className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
          message={(
            <div className="text-center">
              <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Seller profile not found.</p>
              <button onClick={() => refetch()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry</button>
            </div>
          )}
        />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Seller Hero Card */}
          <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[4rem] p-8 sm:p-12 bg-[var(--color-primary-dark)] text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative flex flex-col lg:flex-row items-center gap-10">
              <div className="w-32 h-32 rounded-[2.5rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-5xl font-['Fraunces'] font-bold text-[var(--color-accent)] shadow-2xl">
                {(seller.businessName || 'S').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-4">
                  <h1 className="text-5xl font-['Fraunces'] font-semibold leading-tight">{seller.businessName}</h1>
                  <StatusPill value={seller.status || 'Pending'} />
                </div>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-white/60 font-medium">
                  <span className="flex items-center gap-2"><MapPin size={16} /> {seller.address || 'Location Unverified'}</span>
                  <span className="flex items-center gap-2 text-[var(--color-accent)] uppercase tracking-widest text-[10px] font-bold">Seller ID: {String(userId).slice(-8)}</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-12 lg:grid-cols-[1fr,400px]">
            <div className="space-y-12">
              {/* Business Credentials Grid */}
              <div className="grid gap-6 sm:grid-cols-2">
                <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-8 shadow-xl hover:border-[var(--color-accent)]/20 transition-all rounded-[3rem]">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-forest-light)]/20 text-[var(--color-primary)] flex items-center justify-center mb-6">
                    <Users size={24} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">Full Name</div>
                  <div className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">{seller.name}</div>
                </SurfaceCard>

                <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-8 shadow-xl hover:border-[var(--color-accent)]/20 transition-all rounded-[3rem]">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-sand)]/30 text-[var(--color-primary-dark)] flex items-center justify-center mb-6">
                    <Mail size={24} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">Email Address</div>
                  <div className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] truncate">{seller.email}</div>
                </SurfaceCard>

                <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-8 shadow-xl hover:border-[var(--color-accent)]/20 transition-all rounded-[3rem]">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6">
                    <Phone size={24} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">Phone Number</div>
                  <div className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">{seller.phoneNumber}</div>
                </SurfaceCard>

                <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-8 shadow-xl hover:border-[var(--color-accent)]/20 transition-all rounded-[3rem]">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                    <FileCheck2 size={24} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">GST Number</div>
                  <div className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">{seller.gstNumber || 'Exempt / Not Filed'}</div>
                </SurfaceCard>
              </div>

              {/* Verification Vault */}
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-12 shadow-xl rounded-[3rem]">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Documents</h2>
                    <p className="mt-2 text-[var(--color-text-muted)] font-medium">Review documentation provided during signup.</p>
                  </div>
                  <div className="w-16 h-16 rounded-[1.5rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                    <ShieldCheck size={32} />
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <DocumentVaultCard 
                    icon={<Briefcase size={20} />}
                    label="Business License"
                    href={sanitizeDocUrl(seller.businessProofUrl)}
                    desc="Trade License or Registration"
                  />
                  <DocumentVaultCard 
                    icon={<IdCard size={20} />}
                    label="Identity Document"
                    href={sanitizeDocUrl(seller.identityProofUrl)}
                    desc="National ID or Passport"
                  />
                </div>
              </SurfaceCard>
            </div>

            <aside className="space-y-12">
              {/* Moderation Controls */}
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 shadow-xl rounded-[3rem] sticky top-8">
                <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <AlertCircle size={20} />
                  </div>
                  Actions
                </h3>
                
                <div className="space-y-4">
                  <button
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending || seller.status === 'Approved'}
                    className="w-full group flex items-center justify-between px-6 py-5 rounded-2xl bg-emerald-600 text-white font-bold transition-all hover:bg-emerald-700 disabled:opacity-30 shadow-lg shadow-emerald-900/10"
                  >
                    <span>Approve Seller</span>
                    <CheckCircle2 size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={rejectMutation.isPending || seller.status === 'Rejected'}
                    className="w-full group flex items-center justify-between px-6 py-5 rounded-2xl bg-white border-2 border-rose-100 text-rose-600 font-bold transition-all hover:bg-rose-50 disabled:opacity-30"
                  >
                    <span>Reject Application</span>
                    <XCircle size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {seller.rejectionReason && (
                  <div className="mt-8 p-6 rounded-2xl bg-rose-50 border border-rose-100">
                    <div className="flex items-center gap-2 text-rose-600 text-[10px] font-bold uppercase tracking-widest mb-3">
                      <History size={14} /> Rejection Reason
                    </div>
                    <p className="text-sm text-rose-800/80 italic leading-relaxed">
                      "{seller.rejectionReason}"
                    </p>
                  </div>
                )}
              </SurfaceCard>
            </aside>
          </div>

          <AnimatePresence>
            {showRejectModal && (
              <ReasonModal 
                onClose={() => setShowRejectModal(false)} 
                onSubmit={(reason) => rejectMutation.mutate(reason)}
                isPending={rejectMutation.isPending}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function ReasonModal({ onClose, onSubmit, isPending }) {
  const [reason, setReason] = React.useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--color-primary-dark)]/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
        
        <div className="relative z-10">
          <h3 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Rejection Feedback</h3>
          <p className="text-sm text-[var(--color-text-muted)] font-medium mb-8 leading-relaxed">
            Please provide a reason for the rejection. This will be shown to the seller.
          </p>
          
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Identity proof clarity is insufficient, please provide a high-resolution scan."
            className="w-full h-40 p-6 rounded-2xl bg-[var(--color-sand)]/20 border-2 border-transparent focus:border-rose-500/30 focus:bg-white outline-none transition-all text-[var(--color-primary-dark)] font-medium resize-none placeholder:opacity-40"
          />
          
          <div className="mt-10 flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-8 py-4 rounded-xl font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-sand)]/30 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => reason && onSubmit(reason)}
              disabled={!reason || isPending}
              className="flex-[2] px-8 py-4 rounded-xl bg-rose-600 text-white font-bold shadow-xl shadow-rose-900/10 hover:bg-rose-700 transition-all disabled:opacity-30"
            >
              {isPending ? 'Processing...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DocumentVaultCard({ icon, label, href, desc }) {
  return (
    <a
      href={href || '#'}
      target="_blank"
      rel="noreferrer"
      className={`group relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 ${
        href 
          ? 'bg-white border-[var(--color-stone)]/10 hover:border-[var(--color-accent)] hover:shadow-2xl' 
          : 'bg-stone-50 border-transparent cursor-not-allowed opacity-50'
      }`}
    >
      <div className="flex items-center justify-between mb-8">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${href ? 'bg-[var(--color-sand)]/30 text-[var(--color-primary-dark)] group-hover:bg-[var(--color-accent)] group-hover:text-white' : 'bg-stone-200 text-stone-400'}`}>
          {icon}
        </div>
        {href && (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
            <ExternalLink size={18} />
          </div>
        )}
      </div>
      
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2">{label}</div>
        <div className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-2">
          {href ? 'Digital Copy' : 'Unsubmitted'}
        </div>
        <p className="text-sm text-[var(--color-text-muted)] font-medium leading-relaxed">{desc}</p>
      </div>

      {href && (
        <div className="mt-8 flex items-center gap-2 text-sm font-bold text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
          Review Attachment <ArrowRight size={14} />
        </div>
      )}
    </a>
  );
}
