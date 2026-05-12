import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Boxes, 
  Search, 
  ShoppingBag, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
  Filter,
  Mail,
  MoreVertical,
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SurfaceCard from '../../components/SurfaceCard';
import StatusPill from '../../components/StatusPill';
import StatePanel from '../../components/StatePanel';
import { blockCustomer, deleteCustomer, getAdminCustomers, unblockCustomer } from '../../api/admin';
import { useToast } from '../../hooks/useToast';
import { getPagedItems, getPagedMeta, getResponseData } from '../../utils/api';

export default function Customers() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-customers', search, status, page],
    queryFn: () => getAdminCustomers({ page, pageSize, search: search || undefined, status: status || undefined }),
  });

  const customers = getPagedItems(data) || [];
  const { totalPages } = getPagedMeta(data);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-customers'] });

  const blockMutation = useMutation({
    mutationFn: (id) => blockCustomer(id, 'Blocked from admin panel'),
    onSuccess: (response) => { refresh(); toast.success(response.message || 'Customer access restricted.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to restrict customer.'),
  });

  const unblockMutation = useMutation({
    mutationFn: unblockCustomer,
    onSuccess: (response) => { refresh(); toast.success(response.message || 'Customer access restored.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to restore customer.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: (response) => { refresh(); toast.success(response.message || 'Customer record purged.'); },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to purge record.'),
  });

  return (
    <div className="space-y-12">
      {/* Editorial Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary-dark)] text-white text-[10px] font-bold uppercase tracking-widest mb-6">
            <Users size={14} /> Community Management
          </div>
          <h1 className="text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight">
            The <i className="text-[var(--color-accent)]">Collectors.</i>
          </h1>
          <p className="mt-4 text-xl text-[var(--color-text-muted)] font-medium max-w-2xl">
            A registry of the connoisseurs and collectors participating in the Homiee artisan ecosystem.
          </p>
        </div>
      </header>

      {/* Advanced Filter Bar */}
      <div className="bg-white rounded-[2.5rem] p-4 shadow-xl border border-[var(--color-stone)]/5 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
          <input
            type="text"
            placeholder="Search by collector name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-16 pr-6 py-5 rounded-2xl bg-[var(--color-sand)]/20 border-transparent focus:bg-white focus:border-[var(--color-accent)] transition-all outline-none font-medium text-[var(--color-primary-dark)]"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
            <select 
              value={status} 
              onChange={(event) => { setStatus(event.target.value); setPage(1); }} 
              className="w-full pl-12 pr-4 py-5 rounded-2xl bg-[var(--color-sand)]/20 border-transparent outline-none font-bold text-sm text-[var(--color-primary-dark)] appearance-none cursor-pointer"
            >
              <option value="">All Account Statuses</option>
              <option value="Active">Active Collectors</option>
              <option value="Blocked">Restricted Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collector Registry */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-[2.5rem] bg-[var(--color-sand)]/20" />
            ))}
          </div>
        ) : error ? (
          <StatePanel
            className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[2.5rem]"
            message={(
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--color-primary-dark)] mb-4">The registry failed to synchronize.</p>
                <button onClick={() => refetch()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry Synchronization</button>
              </div>
            )}
          />
        ) : customers.length === 0 ? (
          <SurfaceCard className="bg-white border-[var(--color-stone)]/10 text-center py-24 rounded-[3rem]">
            <Users size={64} className="mx-auto text-[var(--color-sand)] mb-6" />
            <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">No Collectors Found</h3>
            <p className="mt-2 text-[var(--color-text-muted)] font-medium">Refine your registry search to discover community members.</p>
          </SurfaceCard>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid gap-6">
              {customers.map((customer, idx) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <SurfaceCard className="bg-white border-[var(--color-stone)]/5 shadow-xl hover:shadow-2xl hover:border-[var(--color-accent)]/20 transition-all rounded-[2.5rem] p-8 group">
                    <div className="flex flex-col xl:flex-row items-center gap-8">
                      {/* Collector Identity */}
                      <div className="flex items-center gap-6 flex-1 min-w-0 w-full">
                        <div className="w-20 h-20 rounded-[2rem] bg-[var(--color-forest-light)]/30 flex items-center justify-center text-[var(--color-primary-dark)] text-3xl font-['Fraunces'] font-bold shrink-0 shadow-inner group-hover:bg-[var(--color-accent)]/10 transition-colors">
                          {(customer.fullName || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <Link to={`/admin/customers/${customer.id}`} className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                              {customer.fullName}
                            </Link>
                            <StatusPill value={customer.status || 'Active'} />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[var(--color-text-muted)] font-medium text-sm">
                            <span className="flex items-center gap-2"><Mail size={14} /> {customer.email}</span>
                            <span className="flex items-center gap-2"><Calendar size={14} /> Joined {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Suite */}
                      <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-end">
                        <div className="flex items-center gap-3 mr-4 border-r border-[var(--color-stone)]/10 pr-4">
                          {['Blocked', 'Suspended'].includes(customer.status) ? (
                            <button 
                              onClick={() => unblockMutation.mutate(customer.id)} 
                              disabled={unblockMutation.isPending}
                              className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              title="Restore Access"
                            >
                              <UserCheck size={20} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => blockMutation.mutate(customer.id)} 
                              disabled={blockMutation.isPending}
                              className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                              title="Restrict Access"
                            >
                              <UserX size={20} />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              if (window.confirm('Purge this collector record? This action is permanent.')) {
                                deleteMutation.mutate(customer.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            title="Purge Record"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                        
                        <Link 
                          to={`/admin/customers/${customer.id}`}
                          className="px-8 py-4 rounded-2xl bg-[var(--color-sand)]/20 text-[var(--color-primary-dark)] font-bold text-sm hover:bg-[var(--color-primary-dark)] hover:text-white transition-all flex items-center gap-2"
                        >
                          View Profile <ArrowUpRight size={18} />
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
    </div>
  );
}

