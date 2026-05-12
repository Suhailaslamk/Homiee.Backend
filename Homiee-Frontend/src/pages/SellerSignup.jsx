import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, MapPin, Store, UserRound } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';

export default function SellerSignup() {
  const navigate = useNavigate();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/auth/register/seller', data);
      
      if (response.data && response.data.isSuccess) {
        toast.success('Registration successful. Please check your email for verification.');
        navigate('/verify-email', { state: { email: data.email } });
      } else {
        const msg = response.data?.message || 'Registration failed.';
        toast.error(msg);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4 pt-24">
      <div className="w-full max-w-xl rounded-[28px] border border-stone-200 bg-[#fff7ee] p-8 shadow-xl shadow-stone-200/40 sm:p-10">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#f4d6c8] text-[#b85c38]">
            <Store size={30} />
          </div>
          <h2 className="text-3xl font-black text-stone-800">Start your Homiee store</h2>
          <p className="mt-2 text-sm text-stone-500">
            Build a warm storefront for your home business and verify your email to begin selling.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-stone-700">Full Name</label>
            <div className="relative">
              <UserRound className="absolute left-3 top-3.5 text-stone-400" size={18} />
              <input
                {...register('fullName', { required: true })}
                placeholder="Your full name"
                className="w-full rounded-xl border border-stone-200 bg-[#fff7ee] py-3 pl-10 pr-4 text-stone-800 outline-none transition-all focus:border-[#d36f51] focus:ring-2 focus:ring-[#f0c7b7] focus:bg-white"
              />
            </div>
            {errors.fullName && <p className="mt-1 text-xs text-rose-500">Full name is required.</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-stone-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-stone-400" size={18} />
              <input
                type="email"
                {...register('email', { required: true })}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-stone-200 bg-[#fff7ee] py-3 pl-10 pr-4 text-stone-800 outline-none transition-all focus:border-[#d36f51] focus:ring-2 focus:ring-[#f0c7b7] focus:bg-white"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-rose-500">Email is required.</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-stone-700">Password</label>
            <input
              type="password"
              {...register('password', { required: true })}
              placeholder="Create a secure password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-stone-200 bg-[#fff7ee] px-4 py-3 text-stone-800 outline-none transition-all focus:border-[#d36f51] focus:ring-2 focus:ring-[#f0c7b7] focus:bg-white"
            />
            {errors.password && <p className="mt-1 text-xs text-rose-500">Password is required.</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-stone-700">Business Name</label>
            <div className="relative">
              <Store className="absolute left-3 top-3.5 text-stone-400" size={18} />
              <input
                {...register('businessName', { required: true })}
                placeholder="Your store name"
                className="w-full rounded-xl border border-stone-200 bg-[#fff7ee] py-3 pl-10 pr-4 text-stone-800 outline-none transition-all focus:border-[#d36f51] focus:ring-2 focus:ring-[#f0c7b7] focus:bg-white"
              />
            </div>
            {errors.businessName && <p className="mt-1 text-xs text-rose-500">Business name is required.</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-stone-700">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 text-stone-400" size={18} />
              <textarea
                {...register('address', { required: true })}
                rows="3"
                placeholder="Tell customers where your home business is based"
                className="w-full rounded-xl border border-stone-200 bg-[#fff7ee] py-3 pl-10 pr-4 text-stone-800 outline-none transition-all focus:border-[#d36f51] focus:ring-2 focus:ring-[#f0c7b7] focus:bg-white"
              />
            </div>
            {errors.address && <p className="mt-1 text-xs text-rose-500">Address is required.</p>}
          </div>

          <div className="rounded-2xl border border-[#e8c9ba] bg-[#fff7ee] px-4 py-3 text-sm text-stone-600">
            We&apos;ll send a 6-digit OTP to your email after signup so you can verify the account before logging in.
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#3f5143] py-3.5 font-semibold text-white shadow-lg transition hover:bg-[#334237] active:scale-[0.98]"
          >
            Create Seller Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-[#b85c38] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
