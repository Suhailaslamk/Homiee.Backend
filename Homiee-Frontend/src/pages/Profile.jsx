import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronRight, 
  LogOut, 
  Settings, 
  ShieldCheck, 
  Store, 
  Truck, 
  User, 
  MapPin, 
  Package, 
  Heart, 
  Plus, 
  Edit2, 
  Trash2, 
  LayoutDashboard,
  Mail,
  Smartphone,
  Fingerprint,
  Layers,
  Sparkles,
  ArrowRight,
  PlusCircle,
  CreditCard,
  History,
  CheckCircle2,
  X,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProfile, updateProfile } from '../api/profile';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import { getMyOrders, getAddresses, createAddress, updateAddress, deleteAddress } from '../api/customer';
import { getResponseData } from '../utils/api';
import { getWorkspacePath, isCustomerRole } from '../utils/auth';
import { formatCurrency } from '../utils/format';
import SurfaceCard from '../components/SurfaceCard';
import StatusPill from '../components/StatusPill';
import StatePanel from '../components/StatePanel';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('overview');
  const [draftState, setDraftState] = useState({});

  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const profile = data?.data;
  const isCustomer = isCustomerRole(profile?.role);
  const isSeller = profile?.role === 'Seller';

  const { data: ordersResponse } = useQuery({
    queryKey: ['orders'],
    queryFn: getMyOrders,
    enabled: isCustomer,
  });

  const orders = getResponseData(ordersResponse) ?? [];

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(response.message || 'Patron dossier updated.');
    },
    onError: (mutationError) => {
      toast.error(mutationError.response?.data?.message || 'Unable to update dossier.');
    },
  });

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (logoutError) {
      console.error('Logout error:', logoutError);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sellerOnboardingStatus');
    toast.info('Session finalized. You have been signed out.');
    navigate('/login');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDraftState((current) => ({ ...current, [name]: value }));
  };

  const handleSave = (event) => {
    event.preventDefault();

    const formState = {
      name: draftState.name ?? profile?.name ?? '',
      businessName: draftState.businessName ?? profile?.seller?.businessName ?? '',
      phoneNumber: draftState.phoneNumber ?? profile?.seller?.phoneNumber ?? '',
      address: draftState.address ?? profile?.seller?.address ?? '',
      gstNumber: draftState.gstNumber ?? profile?.seller?.gstNumber ?? '',
    };

    updateMutation.mutate({
      name: formState.name,
      businessName: profile?.seller ? formState.businessName : null,
      phoneNumber: profile?.seller ? formState.phoneNumber : null,
      address: profile?.seller ? formState.address : null,
      gstNumber: profile?.seller ? formState.gstNumber : null,
    });
  };

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (error || !profile) {
    return (
      <div className="pt-32 min-h-screen flex items-center justify-center bg-[var(--color-sand)]/20">
        <StatePanel 
          message="Unable to sync patron dossier. Please verify your connection."
          className="bg-white border-[var(--color-stone)]/10 p-12 rounded-[3rem] shadow-xl"
        />
      </div>
    );
  }

  const menuItems = [
    { id: 'overview', label: 'Identity Overview', icon: User },
    { id: 'settings', label: 'Dossier Settings', icon: Settings },
  ];

  if (isCustomer) {
    menuItems.push({ id: 'addresses', label: 'Delivery Registry', icon: MapPin });
  }

  const formState = {
    name: draftState.name ?? profile.name ?? '',
    businessName: draftState.businessName ?? profile.seller?.businessName ?? '',
    phoneNumber: draftState.phoneNumber ?? profile.seller?.phoneNumber ?? '',
    address: draftState.address ?? profile.seller?.address ?? '',
    gstNumber: draftState.gstNumber ?? profile.seller?.gstNumber ?? '',
  };

  return (
    <div className="pt-32 min-h-screen bg-[var(--color-sand)]/10 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Navigation Dossier */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="space-y-6 sticky top-32">
              <SurfaceCard className="bg-[var(--color-primary-dark)] text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-white/10 transition-all duration-700" />
                <div className="relative z-10 text-center">
                  <div className="w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] mx-auto mb-6 flex items-center justify-center text-3xl font-['Fraunces'] font-black text-[var(--color-accent)] shadow-2xl">
                    {(profile.name || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-['Fraunces'] font-semibold truncate px-2">{profile.name}</h2>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{profile.role} Patron</span>
                    <div className="w-1 h-1 rounded-full bg-[var(--color-accent)]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Since {new Date(profile.createdAt).getFullYear()}</span>
                  </div>
                </div>
              </SurfaceCard>

              <div className="flex flex-col gap-2 p-2 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-[var(--color-stone)]/5 shadow-xl">
                {menuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between p-5 rounded-[1.8rem] font-bold transition-all ${
                        isActive
                          ? 'bg-[var(--color-primary-dark)] text-white shadow-xl'
                          : 'text-[var(--color-stone)] hover:bg-[var(--color-sand)]/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon size={20} className={isActive ? 'text-[var(--color-accent)]' : ''} />
                        <span className="text-sm tracking-wide">{item.label}</span>
                      </div>
                      <ChevronRight size={16} className={isActive ? 'opacity-100' : 'opacity-0'} />
                    </button>
                  );
                })}
                
                <div className="h-px bg-[var(--color-stone)]/5 my-2 mx-4" />
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 p-5 rounded-[1.8rem] font-bold text-rose-500 hover:bg-rose-50 transition-all"
                >
                  <LogOut size={20} />
                  <span className="text-sm tracking-wide">Finalize Session</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Canvas */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeTab === 'overview' && <ProfileOverview profile={profile} orders={orders} navigate={navigate} isCustomer={isCustomer} isSeller={isSeller} />}
                {activeTab === 'settings' && (
                  <AccountSettings
                    formState={formState}
                    handleChange={handleChange}
                    handleSave={handleSave}
                    isSaving={updateMutation.isPending}
                    isSeller={Boolean(profile.seller)}
                    role={profile.role}
                  />
                )}
                {activeTab === 'addresses' && isCustomer && <AddressesSection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileOverview({ profile, orders, navigate, isCustomer, isSeller }) {
  return (
    <div className="space-y-12">
      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-[1.2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
            <Fingerprint size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Identity Dossier</h2>
            <p className="text-[var(--color-text-muted)] font-medium mt-1">Management of your core persona on the Homiee platform.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <InfoCard label="Legal Name" value={profile.name} icon={<User size={18} />} />
          <InfoCard label="Transmission Hub" value={profile.email} icon={<Mail size={18} />} />
          <InfoCard label="Platform Role" value={profile.role} icon={<ShieldCheck size={18} />} />
          {profile.seller && <InfoCard label="Studio Status" value={profile.seller.status || 'Verified'} icon={<Store size={18} />} />}
          {profile.delivery && <InfoCard label="Logistics Type" value={profile.delivery.vehicleType || 'Motorized'} icon={<Truck size={18} />} />}
        </div>
      </section>

      {isCustomer && (
        <section className="grid gap-6 md:grid-cols-2">
          <QuickAction 
            onClick={() => navigate('/orders')}
            icon={<Package size={28} />}
            label="Acquisition Ledger"
            description="Track and oversee your collection"
          />
          <QuickAction 
            onClick={() => navigate('/wishlist')}
            icon={<Heart size={28} />}
            label="Curated Vault"
            description="Explore your saved masterpieces"
          />
        </section>
      )}

      {isSeller && (
        <section>
          <button 
            onClick={() => navigate('/seller')} 
            className="w-full flex items-center justify-between p-10 rounded-[3rem] bg-[var(--color-primary-dark)] text-white shadow-2xl group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_60%)]" />
            <div className="relative z-10 flex items-center gap-8 text-left">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center text-[var(--color-accent)] group-hover:scale-110 transition-transform">
                <LayoutDashboard size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-['Fraunces'] font-semibold">Artisan Studio Dashboard</h3>
                <p className="text-white/40 font-medium uppercase tracking-widest text-[10px] mt-1">Manage your professional creative output</p>
              </div>
            </div>
            <ArrowRightCircle size={32} className="relative z-10 text-[var(--color-accent)] group-hover:translate-x-2 transition-transform" />
          </button>
        </section>
      )}

      {profile.seller && (
        <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 rounded-[3.5rem] shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
              <Layers size={20} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-primary-dark)]">Artisan Credentials</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <DetailRow label="Studio Name" value={profile.seller.businessName} />
            <DetailRow label="Verified Contact" value={profile.seller.phoneNumber || 'Dossier Incomplete'} />
            <DetailRow label="Studio Origin" value={profile.seller.address || 'Dossier Incomplete'} />
            <DetailRow label="Tax Registry" value={profile.seller.gstNumber || 'Dossier Incomplete'} />
          </div>
          {profile.seller.rejectionReason && (
            <div className="mt-8 p-6 rounded-[2rem] bg-rose-50 border border-rose-100 text-rose-600 italic text-sm">
              <div className="flex items-center gap-2 mb-2 font-bold uppercase tracking-widest text-[10px]">
                <XCircle size={14} /> Refinement Required
              </div>
              "{profile.seller.rejectionReason}"
            </div>
          )}
        </SurfaceCard>
      )}

      {isCustomer && orders.length > 0 && (
        <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 rounded-[3.5rem] shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                <History size={20} />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-primary-dark)]">Recent Acquisitions</h3>
            </div>
            <button 
              onClick={() => navigate('/orders')} 
              className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest hover:underline"
            >
              Full Ledger
            </button>
          </div>
          
          <div className="space-y-4">
            {orders.slice(0, 3).map((order, idx) => (
              <button
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="w-full flex items-center justify-between p-6 rounded-[2.5rem] bg-[var(--color-sand)]/10 border border-transparent hover:border-[var(--color-accent)]/20 hover:bg-white hover:shadow-xl transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[var(--color-primary-dark)] shadow-sm">
                    <Package size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[var(--color-primary-dark)]">Order #{String(order.id).slice(-8)}</div>
                    <div className="mt-1"><StatusPill value={order.status} /></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--color-primary-dark)]">{formatCurrency(order.totalAmount)}</div>
                  <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}

function AccountSettings({ formState, handleChange, handleSave, isSaving, isSeller, role }) {
  const isAdmin = role === 'Admin';

  return (
    <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 lg:p-12 shadow-xl rounded-[4rem]">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 rounded-[1.2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Dossier Settings</h2>
          <p className="text-[var(--color-text-muted)] font-medium mt-1">Refine your personal and professional profile.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-10 max-w-2xl">
        <div className="space-y-8">
          <InputField label="Patron Designation" name="name" value={formState.name} onChange={handleChange} disabled={isAdmin} icon={<User size={18} />} />
          
          {isSeller && (
            <div className="space-y-8 pt-8 border-t border-[var(--color-stone)]/5">
              <InputField label="Artisan Studio Name" name="businessName" value={formState.businessName} onChange={handleChange} icon={<Store size={18} />} />
              <InputField label="Verified Contact Number" name="phoneNumber" value={formState.phoneNumber} onChange={handleChange} icon={<Smartphone size={18} />} />
              <InputField label="Tax Registry Number" name="gstNumber" value={formState.gstNumber} onChange={handleChange} icon={<CreditCard size={18} />} />
              <TextAreaField label="Studio Origin Address" name="address" value={formState.address} onChange={handleChange} icon={<MapPin size={18} />} />
              
              <div className="flex gap-4 p-6 rounded-[2rem] bg-amber-50 border border-amber-100 text-amber-800 text-xs italic leading-relaxed">
                <Sparkles size={16} className="shrink-0 text-amber-600" />
                "Alterations to your professional credentials may trigger a secondary verification cycle to maintain studio integrity."
              </div>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="p-6 rounded-[2rem] bg-[var(--color-sand)]/10 border border-[var(--color-stone)]/10 text-[var(--color-text-muted)] text-xs font-medium italic">
            "Administrative credentials are locked by the central security protocol for this endpoint."
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving || isAdmin}
          className="w-full sm:w-auto px-12 py-5 rounded-[2rem] bg-[var(--color-primary-dark)] text-white font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? 'Refining Dossier...' : 'Finalize Adjustments'}
        </button>
      </form>
    </SurfaceCard>
  );
}

function AddressesSection() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editingAddress, setEditingAddress] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: addressesResponse, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
  });

  const addresses = getResponseData(addressesResponse) ?? [];

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      toast.success('Address removed from registry.');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: () => toast.error('Unable to remove address from registry.'),
  });

  const handleDelete = (id) => {
    if (window.confirm('Confirm removal of this address from your delivery registry?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
            <MapPin size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Delivery Registry</h2>
            <p className="text-[var(--color-text-muted)] font-medium mt-1">Manage your curated list of acquisition destinations.</p>
          </div>
        </div>
        
        {!isFormOpen && (
          <button 
            onClick={() => { setEditingAddress(null); setIsFormOpen(true); }}
            className="flex items-center justify-center gap-3 bg-[var(--color-primary-dark)] text-white px-8 py-4 rounded-[2rem] font-bold shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={20} /> Register Destination
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isFormOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AddressForm 
              address={editingAddress} 
              onClose={() => setIsFormOpen(false)} 
            />
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-8 md:grid-cols-2"
          >
            {isLoading ? (
              [1, 2].map(i => <div key={i} className="h-48 rounded-[3rem] bg-[var(--color-sand)]/20 animate-pulse" />)
            ) : addresses.length === 0 ? (
              <div className="col-span-2 py-24 text-center bg-[var(--color-sand)]/10 border-2 border-dashed border-[var(--color-stone)]/10 rounded-[4rem]">
                <MapPin size={64} className="mx-auto text-[var(--color-stone)]/20 mb-6" />
                <p className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Registry Quiescent</p>
                <p className="mt-2 text-[var(--color-text-muted)] italic">"Register your first destination for a seamless acquisition cycle."</p>
              </div>
            ) : (
              addresses.map((addr, idx) => (
                <motion.div
                  key={addr.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 relative group hover:shadow-2xl hover:border-[var(--color-accent)]/10 transition-all rounded-[3rem]">
                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingAddress(addr); setIsFormOpen(true); }} 
                        className="w-10 h-10 flex items-center justify-center bg-[var(--color-sand)]/30 text-[var(--color-primary-dark)] rounded-xl hover:bg-[var(--color-accent)] hover:text-white transition-all shadow-sm"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(addr.id)} 
                        className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--color-sand)]/10 flex items-center justify-center text-[var(--color-primary-dark)] shadow-inner">
                        <MapPin size={24} />
                      </div>
                      <h4 className="text-xl font-bold text-[var(--color-primary-dark)] truncate pr-16">{addr.fullName}</h4>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                        <Smartphone size={14} /> {addr.phone}
                      </div>
                      <p className="text-sm text-[var(--color-stone)] font-medium leading-relaxed italic">
                        {addr.line1}<br />
                        {addr.city}, {addr.state} {addr.pincode}
                      </p>
                    </div>
                  </SurfaceCard>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddressForm({ address, onClose }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formData, setFormData] = useState(address || {
    fullName: '', phone: '', line1: '', city: '', state: '', pincode: ''
  });

  const mutationFn = address ? (data) => updateAddress(address.id, data) : createAddress;
  
  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(`Destination ${address ? 'refined' : 'registered'} in dossier.`);
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      onClose();
    },
    onError: () => toast.error(`Unable to sync destination to registry.`),
  });

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 lg:p-12 shadow-xl rounded-[4rem]">
      <div className="flex items-center justify-between mb-12">
        <h3 className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">{address ? 'Refine Destination' : 'Register New Destination'}</h3>
        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-[var(--color-sand)]/20 flex items-center justify-center text-[var(--color-stone)]"><X size={20} /></button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputField label="Recipient Designation" name="fullName" value={formData.fullName} onChange={handleChange} icon={<User size={18} />} />
          <InputField label="Secure Contact" name="phone" value={formData.phone} onChange={handleChange} icon={<Smartphone size={18} />} />
          <div className="md:col-span-2">
            <InputField label="Street Origin" name="line1" value={formData.line1} onChange={handleChange} icon={<MapPin size={18} />} />
          </div>
          <InputField label="City Centre" name="city" value={formData.city} onChange={handleChange} />
          <InputField label="Region / State" name="state" value={formData.state} onChange={handleChange} />
          <InputField label="Pincode Ledger" name="pincode" value={formData.pincode} onChange={handleChange} />
        </div>

        <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-[var(--color-stone)]/5">
          <button 
            type="submit" 
            disabled={mutation.isPending} 
            className="flex-1 h-16 rounded-[2rem] bg-[var(--color-primary-dark)] text-white font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {mutation.isPending ? 'Syncing Registry...' : 'Confirm Registration'}
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className="px-10 h-16 rounded-[2rem] border-2 border-[var(--color-stone)]/5 font-bold text-[var(--color-stone)] hover:bg-[var(--color-sand)]/20 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </SurfaceCard>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-8 shadow-xl transition-all hover:-translate-y-1 rounded-[2.5rem] group">
      <div className="flex items-center gap-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)] shadow-inner">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="text-xl font-bold text-[var(--color-primary-dark)] tracking-tight truncate">{value}</p>
    </SurfaceCard>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="p-6 rounded-[2rem] bg-[var(--color-sand)]/10 border border-transparent hover:border-[var(--color-accent)]/10 transition-all">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">{label}</div>
      <div className="text-sm font-bold text-[var(--color-primary-dark)]">{value}</div>
    </div>
  );
}

function InputField({ label, name, value, onChange, disabled = false, icon }) {
  return (
    <div className="w-full">
      <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.3em] block mb-3 pl-2">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-stone)] group-focus-within:text-[var(--color-accent)] transition-colors">
            {icon}
          </div>
        )}
        <input
          name={name}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          required
          className={`w-full ${icon ? 'pl-14' : 'px-6'} py-5 bg-[var(--color-sand)]/20 rounded-[1.5rem] border-2 border-transparent outline-none focus:bg-white focus:border-[var(--color-accent)]/20 focus:ring-4 focus:ring-[var(--color-accent)]/5 transition-all disabled:cursor-not-allowed disabled:opacity-60 text-[var(--color-primary-dark)] font-bold`}
        />
      </div>
    </div>
  );
}

function TextAreaField({ label, name, value, onChange, icon }) {
  return (
    <div className="w-full">
      <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.3em] block mb-3 pl-2">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-5 top-8 -translate-y-1/2 text-[var(--color-stone)] group-focus-within:text-[var(--color-accent)] transition-colors">
            {icon}
          </div>
        )}
        <textarea
          name={name}
          value={value || ''}
          onChange={onChange}
          rows="5"
          className={`w-full ${icon ? 'pl-14' : 'px-6'} py-5 bg-[var(--color-sand)]/20 rounded-[1.5rem] border-2 border-transparent outline-none focus:bg-white focus:border-[var(--color-accent)]/20 focus:ring-4 focus:ring-[var(--color-accent)]/5 transition-all text-[var(--color-primary-dark)] font-bold`}
        />
      </div>
    </div>
  );
}

function QuickAction({ onClick, icon, label, description }) {
  return (
    <button 
      onClick={onClick} 
      className="flex items-center gap-8 bg-white border border-[var(--color-stone)]/5 p-10 rounded-[3rem] shadow-xl hover:shadow-2xl hover:border-[var(--color-accent)]/10 transition-all text-left group overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-sand)]/30 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:bg-[var(--color-accent)]/20 transition-all duration-700" />
      <div className="w-20 h-20 rounded-[2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)] group-hover:scale-110 group-hover:rotate-12 transition-all shadow-sm relative z-10">
        {icon}
      </div>
      <div className="relative z-10">
        <div className="text-2xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">{label}</div>
        <div className="text-xs text-[var(--color-text-muted)] font-medium mt-1 uppercase tracking-widest">{description}</div>
      </div>
    </button>
  );
}

function ArrowRightCircle({ size, className }) {
  return <ArrowRight size={size} className={className} />;
}

function ProfileLoading() {
  return (
    <div className="pt-32 min-h-screen bg-[var(--color-sand)]/10 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="w-full lg:w-80 space-y-6">
            <div className="h-64 w-full bg-[var(--color-sand)]/20 animate-pulse rounded-[3rem]" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-full bg-white/50 animate-pulse rounded-[1.8rem]" />
              ))}
            </div>
          </div>
          <div className="flex-1 h-[700px] bg-white/50 animate-pulse rounded-[4rem]" />
        </div>
      </div>
    </div>
  );
}


