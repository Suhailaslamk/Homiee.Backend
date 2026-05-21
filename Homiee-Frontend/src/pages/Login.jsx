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
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your internet and credentials.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6 relative overflow-hidden"
         style={{ background: 'radial-gradient(circle at center, var(--color-background) 0%, #f0ede7 100%)' }}>
      {/* Decorative Blobs */}
      <div className="absolute top-[10%] left-[10%] w-[30vw] h-[30vw] bg-[var(--color-accent)]/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-[var(--color-primary)]/5 rounded-full blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="glass rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-16 shadow-[0_40px_80px_-16px_rgba(26,46,26,0.12)] border border-white/60">
          <div className="mb-12">
            <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-sand)]/30 text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-widest mb-10 hover:bg-[var(--color-sand)] transition-colors border border-[var(--color-sand)]/20">
              <Home size={14} /> Back to Home
            </Link>
            
            <h2 className="text-4xl sm:text-5xl font-['Fraunces'] font-semibold text-[var(--color-primary)] leading-tight tracking-[-0.02em]">
              Welcome <i className="text-[var(--color-accent)]">Back.</i>
            </h2>
            <p className="mt-4 text-[var(--color-text-muted)] font-medium text-base sm:text-lg leading-relaxed">
              Log in to your account to continue shopping.
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent)] transition-colors" size={18} />
                  <input
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-[var(--color-sand)] bg-white py-5 pl-16 pr-6 outline-none transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:bg-white text-[var(--color-primary)] font-medium placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-rose-500 font-bold ml-2 uppercase tracking-tighter">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent)] transition-colors" size={18} />
                  <input
                    type="password"
                    {...register('password', { required: 'Password is required' })}
                    placeholder="********"
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-[var(--color-sand)] bg-white py-5 pl-16 pr-6 outline-none transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:bg-white text-[var(--color-primary)] font-medium placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-rose-500 font-bold ml-2 uppercase tracking-tighter">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest px-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input type="checkbox" className="peer w-5 h-5 rounded-lg border-[var(--color-sand)] text-[var(--color-primary)] transition-all cursor-pointer opacity-0 absolute z-10" />
                    <div className="w-5 h-5 rounded-lg border border-[var(--color-sand)] bg-white peer-checked:bg-[var(--color-primary)] peer-checked:border-[var(--color-primary)] transition-all flex items-center justify-center">
                      <Sparkles size={10} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <span className="group-hover:text-[var(--color-primary)] transition-colors">Keep me signed in</span>
                </label>
                <Link to="/forgot-password" title="Currently unavailable" className="hover:text-[var(--color-accent)] transition-colors underline underline-offset-4">Forgot Password?</Link>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-[64px] flex items-center justify-center gap-3 rounded-2xl bg-[var(--color-primary)] py-5 font-bold text-white shadow-xl transition-all hover:bg-black hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Enter Homiee
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 pt-10 border-t border-[var(--color-stone)]/10 text-center">
            <p className="text-sm font-medium text-[var(--color-text-muted)]">
              Don't have an account?{' '}
              <Link to="/signup/customer" className="font-bold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors underline underline-offset-8">Sign up</Link>
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
