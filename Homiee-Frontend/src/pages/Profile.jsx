import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, LogOut, Settings, ShieldCheck, Store, Truck, User } from 'lucide-react';
import { getProfile, updateProfile } from '../api/profile';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import { getMyOrders } from '../api/customer';
import { getResponseData } from '../utils/api';
import { getWorkspacePath, isCustomerRole } from '../utils/auth';

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
  const shouldLoadOrders = isCustomerRole(profile?.role);

  const { data: ordersResponse } = useQuery({
    queryKey: ['orders'],
    queryFn: getMyOrders,
    enabled: shouldLoadOrders,
  });

  const orders = getResponseData(ordersResponse) ?? [];

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(response.message || 'Profile updated successfully.');
    },
    onError: (mutationError) => {
      toast.error(mutationError.response?.data?.message || 'Unable to update profile.');
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
    toast.info('You have been signed out.');
    navigate('/');
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
    return <div className="pt-24 min-h-screen flex items-center justify-center bg-slate-50">Loading profile...</div>;
  }

  if (error || !profile) {
    return <div className="pt-24 min-h-screen flex items-center justify-center bg-slate-50">Unable to load profile.</div>;
  }

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'settings', label: 'Account Settings', icon: Settings },
  ];

  const formState = {
    name: draftState.name ?? profile.name ?? '',
    businessName: draftState.businessName ?? profile.seller?.businessName ?? '',
    phoneNumber: draftState.phoneNumber ?? profile.seller?.phoneNumber ?? '',
    address: draftState.address ?? profile.seller?.address ?? '',
    gstNumber: draftState.gstNumber ?? profile.seller?.gstNumber ?? '',
  };

  return (
    <div className="pt-24 min-h-screen bg-slate-50 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="w-full lg:w-72 space-y-2">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 mb-6 text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-black text-white">
                {(profile.name || 'U').slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-xl font-black text-slate-900">{profile.name}</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{profile.role}</p>
            </div>

            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${
                  activeTab === item.id
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'bg-white text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  {item.label}
                </div>
                <ChevronRight size={16} className={activeTab === item.id ? 'opacity-100' : 'opacity-0'} />
              </button>
            ))}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-colors mt-10"
            >
              <LogOut size={20} /> Sign Out
            </button>
          </div>

          <div className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm p-10">
            {activeTab === 'overview' && <ProfileOverview profile={profile} orders={orders} navigate={navigate} />}
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
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileOverview({ profile, orders, navigate }) {
  const isCustomer = isCustomerRole(profile.role);
  const workspacePath = getWorkspacePath(profile.role);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900">Profile Overview</h2>
        <p className="mt-2 text-slate-500">This page now reflects the authenticated profile returned by the API.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard label="Name" value={profile.name} icon={<User size={18} />} />
        <InfoCard label="Email" value={profile.email} icon={<ShieldCheck size={18} />} />
        <InfoCard label="Role" value={profile.role} icon={<ShieldCheck size={18} />} />
        {profile.seller && <InfoCard label="Seller Status" value={profile.seller.status || 'Unknown'} icon={<Store size={18} />} />}
        {profile.delivery && <InfoCard label="Vehicle Type" value={profile.delivery.vehicleType || 'Not set'} icon={<Truck size={18} />} />}
      </div>

      {profile.seller && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-lg font-bold text-slate-900">Seller Details</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <DetailRow label="Business Name" value={profile.seller.businessName} />
            <DetailRow label="Phone Number" value={profile.seller.phoneNumber || 'Not set'} />
            <DetailRow label="Address" value={profile.seller.address || 'Not set'} />
            <DetailRow label="GST Number" value={profile.seller.gstNumber || 'Not set'} />
          </div>
          {profile.seller.rejectionReason && (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              Rejection reason: {profile.seller.rejectionReason}
            </p>
          )}
        </div>
      )}

      {!profile.seller && !profile.delivery && !isCustomer && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
          Role-specific profile details will appear here when the backend returns them for this account.
        </div>
      )}

      {isCustomer ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
            <button onClick={() => navigate('/orders')} className="text-sm font-bold text-blue-600">View all orders</button>
          </div>
          <div className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No orders yet for this account.</div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <button
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                >
                  <div>
                    <div className="font-bold text-slate-900">Order #{order.id}</div>
                    <div className="text-sm text-slate-500">{order.status}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">${Number(order.totalAmount).toFixed(2)}</div>
                    <div className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Workspace Access</h3>
            <button onClick={() => navigate(workspacePath)} className="text-sm font-bold text-blue-600">Open workspace</button>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            This account does not use the customer cart and order flow. Use your workspace tools instead.
          </p>
        </div>
      )}
    </div>
  );
}

function AccountSettings({ formState, handleChange, handleSave, isSaving, isSeller, role }) {
  const isAdmin = role === 'Admin';

  return (
    <form onSubmit={handleSave} className="animate-in fade-in slide-in-from-right-4">
      <h2 className="text-2xl font-black text-slate-900 mb-8">Account Settings</h2>
      <div className="space-y-6 max-w-2xl">
        <InputField label="Display Name" name="name" value={formState.name} onChange={handleChange} disabled={isAdmin} />
        {isSeller && (
          <>
            <InputField label="Business Name" name="businessName" value={formState.businessName} onChange={handleChange} />
            <InputField label="Phone Number" name="phoneNumber" value={formState.phoneNumber} onChange={handleChange} />
            <InputField label="GST Number" name="gstNumber" value={formState.gstNumber} onChange={handleChange} />
            <TextAreaField label="Business Address" name="address" value={formState.address} onChange={handleChange} />
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              Seller profile edits may send the seller back into submitted review status based on backend rules.
            </p>
          </>
        )}
        {isAdmin && (
          <p className="text-sm text-slate-600 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            Admin profile edits are blocked by the backend on this endpoint, so this section is view-only for admin accounts.
          </p>
        )}
        <button
          type="submit"
          disabled={isSaving || isAdmin}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-600 transition shadow-lg disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div className="rounded-3xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 text-slate-400">
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-3 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4 border border-slate-200">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-700">{value}</div>
    </div>
  );
}

function InputField({ label, name, value, onChange, disabled = false }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

function TextAreaField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows="4"
        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 transition"
      />
    </div>
  );
}
