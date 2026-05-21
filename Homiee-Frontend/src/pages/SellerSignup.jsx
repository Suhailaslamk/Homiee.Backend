import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, MapPin, Store, UserRound, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';

export default function SellerSignup() {
  const navigate = useNavigate();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

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
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      
      if (status === 409 && message.includes('not verified')) {
        toast.info('This email is already registered. Redirecting to verification...');
        setTimeout(() => {
          navigate('/verify-email', { state: { email: data.email } });
        }, 1500);
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-6 pt-28 pb-16 relative overflow-hidden"
         style={{ background: 'radial-gradient(circle at center, var(--color-background) 0%, #f0ede7 100%)' }}>
      {/* Decorative Blobs */}
      <div className="absolute top-[10%] left-[10%] w-[30vw] h-[30vw] bg-[var(--color-accent)]/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-[var(--color-primary)]/5 rounded-full blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl glass rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-12 shadow-[0_40px_80px_-16px_rgba(26,46,26,0.1)] border border-white/60 relative z-10"
      >
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/10 shadow-inner">
            <Store size={36} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary)] mb-4 tracking-[-0.02em]">Start Selling on <i className="text-[var(--color-accent)]">Homiee.</i></h2>
          <p className="text-base text-[var(--color-text-muted)] font-medium leading-relaxed px-4">
            Join our community of local sellers and reach customers who value unique, handcrafted products.
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
                className="w-full rounded-2xl border border-[var(--color-sand)] bg-white py-4 pl-12 pr-6 text-[var(--color-primary)] outline-none transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:bg-white placeholder:text-[var(--color-text-muted)] font-medium"
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
                className="w-full rounded-2xl border border-[var(--color-sand)] bg-white py-4 pl-12 pr-6 text-[var(--color-primary)] outline-none transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:bg-white placeholder:text-[var(--color-text-muted)] font-medium"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-rose-500">Email is required.</p>}
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-stone-700 ml-2">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-stone-400 group-focus-within:text-[var(--color-accent)] transition-colors" size={18} />
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                placeholder="Create a secure password"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-[var(--color-sand)] bg-white py-4 pl-12 pr-6 text-[var(--color-primary)] outline-none transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:bg-white placeholder:text-[var(--color-text-muted)] font-medium"
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-rose-500 font-bold ml-2 uppercase tracking-tighter">{errors.password.message}</p>}
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

          <div className="rounded-2xl border border-[var(--color-accent)]/10 bg-[var(--color-accent)]/5 px-6 py-4 text-xs font-medium text-[var(--color-text-muted)] leading-relaxed">
            We'll send a 6-digit OTP to your inbox. This ensures your account is verified before we begin the onboarding process.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[var(--color-primary)] py-5 font-bold text-white shadow-xl transition-all hover:bg-black hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-[#b85c38] hover:underline">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
