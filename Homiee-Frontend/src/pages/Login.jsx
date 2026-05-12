import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Loader2, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { getProfile } from '../api/profile';
import { useToast } from '../hooks/useToast';
import { getCurrentRole, getDefaultAuthenticatedPath, isSellerRole } from '../utils/auth';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data) => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/login', data);
      const accessToken = response.data?.data?.accesstoken;
      const refreshToken = response.data?.data?.refreshToken;

      if (!accessToken) {
        throw new Error('Access token missing from login response');
      }

      localStorage.setItem('token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      const role = getCurrentRole();
      let destination = getDefaultAuthenticatedPath(role);

      if (isSellerRole(role)) {
        try {
          const profileResponse = await getProfile();
          const sellerStatus = profileResponse?.data?.seller?.status;
          destination = sellerStatus === 'Approved' ? '/seller/dashboard' : '/seller/onboarding';
        } catch (profileError) {
          console.error('Unable to resolve seller onboarding status:', profileError);
          destination = '/seller/onboarding';
        }
      }

      toast.success('Signed in successfully.');
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2000&auto=format&fit=crop" 
          alt="Artisanal Background" 
          className="w-full h-full object-cover scale-105 blur-[2px]"
        />
        <div className="absolute inset-0 bg-[var(--color-primary-dark)]/60 backdrop-blur-[2px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-[48px] p-12 sm:p-16 shadow-2xl border border-white/20">
          <div className="mb-12">
            <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-sand)]/30 text-[var(--color-primary-dark)] text-xs font-bold uppercase tracking-widest mb-8 hover:bg-[var(--color-sand)]/50 transition-colors">
              <Home size={14} /> Back to Home
            </Link>
            
            <h2 className="text-5xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight">
              Welcome <i className="text-[var(--color-accent)]">Back</i>
            </h2>
            <p className="mt-4 text-[var(--color-text-muted)] font-medium text-lg">
              Enter your credentials to access your curated collection and dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent)] transition-colors" size={20} />
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-[var(--color-stone)]/10 bg-[var(--color-sand)]/5 py-5 pl-16 pr-6 outline-none transition-all focus:border-[var(--color-accent)] focus:bg-white text-[var(--color-text-main)] font-medium"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-500 font-bold ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent)] transition-colors" size={20} />
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  placeholder="********"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-[var(--color-stone)]/10 bg-[var(--color-sand)]/5 py-5 pl-16 pr-6 outline-none transition-all focus:border-[var(--color-accent)] focus:bg-white text-[var(--color-text-main)] font-medium"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-500 font-bold ml-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-[var(--color-stone)]/20 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                <span className="group-hover:text-[var(--color-primary-dark)] transition-colors">Remember me</span>
              </label>
              <Link to="/forgot-password" title="Currently unavailable" className="hover:text-[var(--color-accent)] transition-colors">Forgot Password?</Link>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[var(--color-primary-dark)] py-5 font-bold text-white shadow-xl shadow-[var(--color-primary-dark)]/20 transition hover:bg-[var(--color-primary)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Enter Homiee
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-12 border-t border-[var(--color-stone)]/10 text-center">
            <p className="text-sm font-medium text-[var(--color-text-muted)]">
              New to the community?{' '}
              <Link to="/signup/customer" className="font-bold text-[var(--color-primary-dark)] hover:text-[var(--color-accent)] transition-colors underline underline-offset-4">Join as a Collector</Link>
            </p>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-[var(--color-accent)] rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[var(--color-primary)] rounded-full blur-3xl opacity-20 pointer-events-none" />
      </motion.div>
    </div>
  );
}
