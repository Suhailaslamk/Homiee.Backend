import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Boxes, 
  ShoppingBag, 
  Users, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  UserCheck,
  UserX,
  Store,
  Filter,
  MoreVertical,
  ExternalLink,
  Mail,
  Phone,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SurfaceCard from '../../components/SurfaceCard';
import StatusPill from '../../components/StatusPill';
import StatePanel from '../../components/StatePanel';
import { approveSeller, getAdminSellers, rejectSeller, suspendSeller } from '../../api/admin';
import { useToast } from '../../hooks/useToast';
import { getPagedItems, getPagedMeta, getResponseData } from '../../utils/api';

export default function Sellers() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const pageSize = 10;

  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-sellers', status, search, page],
    queryFn: () => getAdminSellers({ page, pageSize, status: status || undefined, search: search || undefined }),
  });

  const rawSellers = getPagedItems(data);
  let sellers = (Array.isArray(rawSellers) && rawSellers.length > 0) ? rawSellers : (getResponseData(data) || []);
  
  if (Array.isArray(sellers)) {
    sellers = [...sellers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  const { totalPages } = getPagedMeta(data);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });

  const approveMutation = useMutation({
    mutationFn: approveSeller,
    onSuccess: (response) => { refresh(); toast.success(response.message || 'Seller approved.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to approve seller.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }) => rejectSeller(userId, reason),
    onSuccess: (response) => { 
      refresh(); 
      toast.success(response.message || 'Seller application rejected.'); 
      setShowRejectModal(false);
      setSelectedUserId(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to reject seller.'),
  });

  const suspendMutation = useMutation({
    mutationFn: (userId) => suspendSeller(userId, 'Suspended from platform'),
    onSuccess: (response) => { refresh(); toast.success(response.message || 'Seller suspended.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to suspend seller.'),
  });

  return (
    <div className="space-y-12">
      {/* Editorial Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary-dark)] text-white text-[10px] font-bold uppercase tracking-widest mb-6">
            <ShieldCheck size={14} /> Seller Management
          </div>
          <h1 className="text-4xl sm:text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight">
            Seller <i className="text-[var(--color-accent)]">List.</i>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-[var(--color-text-muted)] font-medium max-w-2xl">
            Review, verify, and manage the sellers on the platform.
          </p>
        </div>
      </header>

      {/* Advanced Filter Bar */}
      <div className="bg-white rounded-[2.5rem] p-4 shadow-xl border border-[var(--color-stone)]/5 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
          <input
            type="text"
            placeholder="Search by seller or shop name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-16 pr-6 py-5 rounded-2xl bg-[var(--color-sand)]/20 border-transparent focus:bg-white focus:border-[var(--color-accent)] transition-all outline-none font-medium text-[var(--color-primary-dark)]"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex bg-[var(--color-sand)]/20 p-1.5 rounded-[1.5rem] border border-[var(--color-stone)]/5">
            <button 
              onClick={() => { setStatus(''); setPage(1); }}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!status ? 'bg-white text-[var(--color-primary-dark)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary-dark)]'}`}
            >
              All
            </button>
            <button 
              onClick={() => { setStatus('Submitted'); setPage(1); }}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${status === 'Submitted' ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-orange-900/10' : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary-dark)]'}`}
            >
              Pending Approval
            </button>
          </div>
          <div className="relative w-full md:w-64">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
            <select 
              value={status} 
              onChange={(event) => { setStatus(event.target.value); setPage(1); }} 
              className="w-full pl-12 pr-4 py-5 rounded-2xl bg-[var(--color-sand)]/20 border-transparent outline-none font-bold text-sm text-[var(--color-primary-dark)] appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="Submitted">Pending Approval</option>
              <option value="Approved">Verified Sellers</option>
              <option value="Rejected">Rejected</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Artisan List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-[2.5rem] bg-[var(--color-sand)]/20" />
            ))}
          </div>
        ) : error ? (
          <StatePanel
            className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[2.5rem]"
            message={(
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--color-primary-dark)] mb-4">The directory failed to load.</p>
                <button onClick={() => refetch()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry Directory</button>
              </div>
            )}
          />
        ) : sellers.length === 0 ? (
          <SurfaceCard className="bg-white border-[var(--color-stone)]/10 text-center py-24 rounded-[2rem] sm:rounded-[3rem]">
            <Store size={64} className="mx-auto text-[var(--color-sand)] mb-6" />
            <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">No Sellers Found</h3>
            <p className="mt-2 text-[var(--color-text-muted)] font-medium">Try adjusting your filters.</p>
          </SurfaceCard>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid gap-6">
              {sellers.map((seller, idx) => (
                <motion.div
                  key={seller.userId || seller.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <SurfaceCard className="bg-white border-[var(--color-stone)]/5 shadow-xl hover:shadow-2xl hover:border-[var(--color-accent)]/20 transition-all rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 group">
                    <div className="flex flex-col xl:flex-row items-center gap-8">
                      {/* Artisan Identity */}
                      <div className="flex items-center gap-6 flex-1 min-w-0 w-full">
                        <div className="w-20 h-20 rounded-[2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)] text-3xl font-['Fraunces'] font-bold shrink-0 shadow-inner group-hover:bg-[var(--color-accent)]/10 transition-colors">
                           {(seller.businessName || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <Link to={`/admin/sellers/${seller.userId || seller.id}`} className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                              {seller.businessName}
                            </Link>
                            <StatusPill value={seller.status} />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[var(--color-text-muted)] font-medium text-sm">
                            <span className="flex items-center gap-2"><Users size={14} /> {seller.name}</span>
                            <span className="flex items-center gap-2"><Mail size={14} /> {seller.email}</span>
                            <span className="flex items-center gap-2 text-[var(--color-accent)] font-bold"><Clock size={14} /> Requested {new Date(seller.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Suite */}
                      <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-end">
                        <div className="flex items-center gap-3 mr-4 border-r border-[var(--color-stone)]/10 pr-4">
                          {['Submitted', 'Pending', 'Rejected', 'Suspended'].includes(seller.status) && (
                            <button 
                              onClick={() => approveMutation.mutate(seller.userId)} 
                              disabled={approveMutation.isPending}
                              className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              title="Approve Seller"
                            >
                              <UserCheck size={20} />
                            </button>
                          )}
                          {['Submitted', 'Pending'].includes(seller.status) && (
                            <button 
                              onClick={() => {
                                setSelectedUserId(seller.userId);
                                setShowRejectModal(true);
                              }} 
                              disabled={rejectMutation.isPending}
                              className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                              title="Reject Application"
                            >
                              <UserX size={20} />
                            </button>
                          )}
                          {seller.status === 'Approved' && (
                            <button 
                              onClick={() => suspendMutation.mutate(seller.userId)} 
                              disabled={suspendMutation.isPending}
                              className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                              title="Suspend Seller"
                            >
                              <UserX size={20} />
                            </button>
                          )}
                        </div>
                        
                        <Link 
                          to={`/admin/sellers/${seller.userId || seller.id}`}
                          className="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-[var(--color-sand)]/20 text-[var(--color-primary-dark)] font-bold text-sm hover:bg-[var(--color-primary-dark)] hover:text-white transition-all flex items-center gap-2"
                        >
                          View Details <ArrowUpRight size={18} />
                        </Link>
                      </div>
                    </div>
                  </SurfaceCard>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Refined Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 py-12">
          <button 
            disabled={page === 1}
            onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="w-14 h-14 rounded-full bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 hover:bg-[var(--color-sand)]/20 transition-all shadow-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="px-8 py-4 rounded-full bg-white border border-[var(--color-stone)]/10 text-sm font-bold text-[var(--color-primary-dark)] shadow-lg uppercase tracking-widest">
            Page <span className="text-[var(--color-accent)]">{page}</span> of {totalPages}
          </div>
          <button 
            disabled={page === totalPages}
            onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="w-14 h-14 rounded-full bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)] disabled:opacity-30 hover:bg-[var(--color-sand)]/20 transition-all shadow-lg"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      <AnimatePresence>
        {showRejectModal && (
          <ReasonModal 
            onClose={() => {
              setShowRejectModal(false);
              setSelectedUserId(null);
            }} 
            onSubmit={(reason) => rejectMutation.mutate({ userId: selectedUserId, reason })}
            isPending={rejectMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ReasonModal({ onClose, onSubmit, isPending }) {
  const [reason, setReason] = useState('');

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
            Please provide a reason for the rejection. This will be shown to the seller to help them correct their application.
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
