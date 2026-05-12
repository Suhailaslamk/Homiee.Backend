import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Boxes, 
  Calendar, 
  ChevronLeft, 
  Mail, 
  ShoppingBag, 
  Users, 
  CheckCircle2, 
  XCircle,
  UserCheck,
  Package,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Globe,
  Wallet,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import SurfaceCard from '../../components/SurfaceCard';
import StatusPill from '../../components/StatusPill';
import StatePanel from '../../components/StatePanel';
import { getAdminCustomerById, getAdminCustomerOrders } from '../../api/admin';
import { getResponseData } from '../../utils/api';
import { formatCurrency } from '../../utils/format';

export default function CustomerDetails() {
  const { customerId } = useParams();

  const { data: customerResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-customer', customerId],
    queryFn: () => getAdminCustomerById(customerId),
    enabled: Boolean(customerId),
  });

  const { data: ordersResponse } = useQuery({
    queryKey: ['admin-customer-orders', customerId],
    queryFn: () => getAdminCustomerOrders(customerId),
    enabled: Boolean(customerId),
  });

  const customer = getResponseData(customerResponse);
  const rawOrders = getResponseData(ordersResponse);
  const orders = Array.isArray(rawOrders) ? rawOrders : [];

  return (
    <div className="space-y-12 pb-20">
      {/* Editorial Navigation */}
      <nav className="flex items-center justify-between">
        <Link 
          to="/admin/customers" 
          className="group flex items-center gap-3 text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary-dark)] transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center shadow-sm group-hover:bg-[var(--color-sand)]/20 transition-all">
            <ChevronLeft size={18} />
          </div>
          Back to Registry
        </Link>
      </nav>

      {isLoading ? (
        <div className="space-y-12">
          <div className="h-48 animate-pulse rounded-[3rem] bg-[var(--color-sand)]/20" />
          <div className="grid gap-12 lg:grid-cols-[400px,1fr]">
            <div className="h-96 animate-pulse rounded-[3rem] bg-[var(--color-sand)]/20" />
            <div className="h-96 animate-pulse rounded-[3rem] bg-[var(--color-sand)]/20" />
          </div>
        </div>
      ) : error || !customer ? (
        <StatePanel
          className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
          message={(
            <div className="text-center">
              <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Collector profile not found.</p>
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
          {/* Collector Hero Card */}
          <section className="relative overflow-hidden rounded-[4rem] bg-[var(--color-sand)]/30 p-12 shadow-inner">
            <div className="relative flex flex-col lg:flex-row items-center gap-10">
              <div className="w-32 h-32 rounded-[2.5rem] bg-[var(--color-primary-dark)] flex items-center justify-center text-5xl font-['Fraunces'] font-bold text-[var(--color-accent)] shadow-2xl">
                {(customer.fullName || 'C').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-4">
                  <h1 className="text-5xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight">{customer.fullName}</h1>
                  <StatusPill value={customer.status || 'Active'} />
                </div>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-[var(--color-text-muted)] font-medium">
                  <span className="flex items-center gap-2"><Mail size={16} /> {customer.email}</span>
                  <span className="flex items-center gap-2 text-[var(--color-primary)] uppercase tracking-widest text-[10px] font-bold">Member ID: {customerId.slice(-8)}</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-12 lg:grid-cols-[400px,1fr]">
            <aside className="space-y-12">
              {/* Profile Insights */}
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 shadow-xl rounded-[3rem]">
                <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-forest-light)]/20 text-[var(--color-primary)] flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                  Collector Insights
                </h3>
                
                <div className="space-y-6">
                  <ProfileInsight 
                    icon={customer.isEmailVerified ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    label="Trust Level"
                    value={customer.isEmailVerified ? 'Email Verified' : 'Awaiting Verification'}
                    accent={customer.isEmailVerified ? 'forest' : 'rose'}
                  />
                  <ProfileInsight 
                    icon={<Calendar size={18} />}
                    label="Registry Date"
                    value={new Date(customer.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  />
                  <ProfileInsight 
                    icon={<Package size={18} />}
                    label="Acquisition Volume"
                    value={`${orders.length} Curated Orders`}
                  />
                </div>

                <div className="mt-10 p-6 rounded-[2rem] bg-[var(--color-sand)]/20 border border-[var(--color-stone)]/5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-3">Auditor Notes</div>
                  <p className="text-sm text-[var(--color-primary-dark)] italic leading-relaxed">
                    "Collector activity monitored since {new Date(customer.createdAt).getFullYear()}. Currently evaluating purchase frequency."
                  </p>
                </div>
              </SurfaceCard>
            </aside>

            <div className="space-y-12">
              {/* Transaction Ledger */}
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-12 shadow-xl rounded-[3rem]">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Transaction Ledger</h2>
                    <p className="mt-2 text-[var(--color-text-muted)] font-medium">A chronological log of all acquisitions initiated by this collector.</p>
                  </div>
                  <div className="w-16 h-16 rounded-[1.5rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                    <Receipt size={32} />
                  </div>
                </div>

                <div className="space-y-6">
                  {orders.length === 0 ? (
                    <div className="rounded-[2.5rem] border-2 border-dashed border-[var(--color-stone)]/10 bg-[var(--color-sand)]/10 p-20 text-center">
                      <ShoppingBag size={48} className="mx-auto text-[var(--color-stone)]/30 mb-6" />
                      <p className="text-lg font-medium text-[var(--color-text-muted)] italic">This collector has not initiated any transactions yet.</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <Link 
                        key={order.id} 
                        to={`/admin/orders/${order.id}`}
                        className="block group"
                      >
                        <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-[2.5rem] bg-[var(--color-sand)]/10 border border-transparent hover:border-[var(--color-accent)]/20 hover:bg-white hover:shadow-2xl transition-all duration-500">
                          <div className="w-16 h-16 rounded-2xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)] shrink-0 group-hover:scale-110 transition-transform">
                            <ShoppingBag size={24} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Order #{String(order.id).slice(-8)}</span>
                              <StatusPill value={order.status || 'Pending'} />
                            </div>
                            <div className="flex items-center gap-4 text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-widest">
                              <Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </div>
                          </div>

                          <div className="text-right border-l border-[var(--color-stone)]/10 pl-8">
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1">Total Valuation</div>
                            <div className="text-2xl font-bold text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent)] transition-colors">{formatCurrency(order.totalAmount)}</div>
                          </div>

                          <div className="w-12 h-12 rounded-full bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-[var(--color-primary-dark)] group-hover:bg-[var(--color-primary-dark)] group-hover:text-white transition-all shadow-sm">
                            <ArrowUpRight size={20} />
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </SurfaceCard>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ProfileInsight({ icon, label, value, accent = 'default' }) {
  const accents = {
    default: 'bg-[var(--color-sand)]/30 text-[var(--color-primary-dark)]',
    forest: 'bg-[var(--color-forest-light)]/30 text-[var(--color-primary)]',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="flex items-center gap-5 p-5 rounded-[2rem] bg-[var(--color-sand)]/10 border border-[var(--color-stone)]/5 transition-all hover:bg-white hover:shadow-lg group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${accents[accent]}`}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1">{label}</div>
        <div className="text-[var(--color-primary-dark)] font-bold tracking-tight">{value}</div>
      </div>
    </div>
  );
}
