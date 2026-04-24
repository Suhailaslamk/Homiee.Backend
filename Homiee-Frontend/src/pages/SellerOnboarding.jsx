import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Clock, Upload } from 'lucide-react';
import api from '../api/axios';
import { getProfile } from '../api/profile';
import { useToast } from '../hooks/useToast';

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const { register, reset, handleSubmit, formState: { errors } } = useForm();

  const { data: profileResponse, isLoading, refetch } = useQuery({
    queryKey: ['profile', 'seller-onboarding'],
    queryFn: getProfile,
  });

  const profile = profileResponse?.data;
  const seller = profile?.seller;
  const sellerStatus = seller?.status;

  useEffect(() => {
    if (sellerStatus === 'Approved') {
      navigate('/seller/dashboard', { replace: true });
    }
  }, [navigate, sellerStatus]);

  useEffect(() => {
    if (seller) {
      reset({
        sellerName: profile?.name ?? '',
        businessName: seller.businessName ?? '',
        phoneNumber: seller.phoneNumber ?? '',
        address: seller.address ?? '',
        gstNumber: seller.gstNumber ?? '',
      });
    }
  }, [profile?.name, reset, seller]);

  const submitProfile = async (data, endpoint) => {
    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof FileList) {
          if (value[0]) {
            formData.append(key, value[0]);
          }
          return;
        }

        formData.append(key, value ?? '');
      });

      await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await refetch();
      toast.success(endpoint.includes('resubmit') ? 'Seller profile resubmitted for review.' : 'Seller profile submitted for verification.');
    } catch (err) {
      console.error('Seller onboarding failed:', err);
      toast.error(err.response?.data?.message || 'Seller onboarding failed. Please check the form and try again.');
    }
  };

  if (isLoading) {
    return <CenteredState title="Loading seller profile..." description="Checking your seller verification status." />;
  }

  if (sellerStatus === 'Approved') {
    return <CenteredState title="Redirecting to seller workspace..." description="Your account is already approved." />;
  }

  if (sellerStatus === 'Submitted') {
    return (
      <CenteredState
        title="Verification Pending"
        description="Your seller profile has already been submitted and is waiting for admin review."
        icon={<Clock size={40} className="animate-pulse text-amber-600" />}
      >
        <button
          onClick={() => refetch()}
          className="w-full rounded-xl bg-slate-800 py-3 font-semibold text-white transition hover:bg-slate-900"
        >
          Refresh status
        </button>
      </CenteredState>
    );
  }

  if (sellerStatus === 'Suspended') {
    return (
      <CenteredState
        title="Seller Account Suspended"
        description="Your seller account is suspended right now. Please contact support or an administrator before making further changes."
        icon={<AlertTriangle size={40} className="text-rose-600" />}
      />
    );
  }

  const isRejected = sellerStatus === 'Rejected';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-8 text-white">
          <h1 className="text-2xl font-bold">{isRejected ? 'Resubmit Your Seller Profile' : 'Complete Your Seller Profile'}</h1>
          <p className="text-slate-400 mt-1">
            {isRejected
              ? 'Update your business details and upload fresh documents for another review.'
              : 'Provide your business details to begin the verification process.'}
          </p>
        </div>

        {isRejected && (
          <div className="mx-8 mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            Rejection reason: {seller?.rejectionReason || 'The admin requested profile changes before approval.'}
          </div>
        )}

        <form
          onSubmit={handleSubmit((data) => submitProfile(data, isRejected ? '/seller/resubmit' : '/seller/complete-profile'))}
          className="p-8 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Seller Name" error={errors.sellerName}>
              <input {...register('sellerName', { required: true })} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your full name" />
            </Field>
            <Field label="Business Name" error={errors.businessName}>
              <input {...register('businessName', { required: true })} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Homiee Traders" />
            </Field>
            <Field label="Phone Number" error={errors.phoneNumber}>
              <input {...register('phoneNumber', { required: true })} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="9876543210" />
            </Field>
            <Field label="City" error={errors.city}>
              <input {...register('city', { required: true })} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Kochi" />
            </Field>
            <Field label="State" error={errors.state}>
              <input {...register('state', { required: true })} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Kerala" />
            </Field>
            <Field label="Pincode" error={errors.pincode}>
              <input {...register('pincode', { required: true })} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="682001" />
            </Field>
            <Field label="Business License Number" error={errors.licenseNumber}>
              <input {...register('licenseNumber', { required: true })} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="TAX-ID-123" />
            </Field>
            <Field label="GST Number" error={errors.gstNumber}>
              <input {...register('gstNumber', { required: true })} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="22AAAAA0000A1Z5" />
            </Field>
          </div>

          <Field label="Business Address" error={errors.address}>
            <textarea {...register('address', { required: true })} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" rows="4" placeholder="Full business address" />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UploadField label="Business Proof" register={register('businessProof', { required: !isRejected })} error={errors.businessProof} />
            <UploadField label="Identity Proof" register={register('identityProof', { required: !isRejected })} error={errors.identityProof} />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">
            {isRejected ? 'Resubmit for Verification' : 'Submit for Verification'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{label} is required.</p>}
    </div>
  );
}

function UploadField({ label, register, error }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
        <Upload className="mx-auto text-slate-400 mb-2" />
        <input type="file" {...register} className="w-full text-sm" accept=".pdf,.jpg,.jpeg,.png" />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{label} is required.</p>}
    </div>
  );
}

function CenteredState({ title, description, icon, children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          {icon || <CheckCircle size={40} className="text-blue-600" />}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500 mb-8">{description}</p>
        {children}
      </div>
    </div>
  );
}
