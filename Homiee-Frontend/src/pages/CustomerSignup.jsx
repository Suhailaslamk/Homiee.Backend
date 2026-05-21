import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, Lock, Mail, UserRound, ArrowRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';

export default function CustomerSignup() {
  const navigate = useNavigate();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/auth/register/customer', data);
      if (response.data.isSuccess) {
        toast.success('Registration successful. Please check your email for verification.');
        navigate('/verify-email', { state: { email: data.email } });
      } else {
        toast.error(response.data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      const status = err.response?.status;
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      
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
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6 relative overflow-hidden"
         style={{ background: 'radial-gradient(circle at center, var(--color-background) 0%, #f0ede7 100%)' }}>
      {/* Decorative Blobs */}
      <div className="absolute top-[10%] left-[10%] w-[30vw] h-[30vw] bg-[var(--color-accent)]/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-[var(--color-primary)]/5 rounded-full blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl"
      >
        <div className="glass rounded-[3.5rem] p-12 sm:p-16 shadow-[0_40px_80px_-16px_rgba(26,46,26,0.12)] border border-white/60">
          <div className="mb-12">
            <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-sand)]/30 text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-widest mb-10 hover:bg-[var(--color-sand)] transition-colors border border-[var(--color-sand)]/20">
              <Home size={14} /> Back to Home
            </Link>
            
            <h2 className="text-4xl sm:text-5xl font-['Fraunces'] font-semibold text-[var(--color-primary)] leading-tight tracking-[-0.02em]">
              Create an <i className="text-[var(--color-accent)]">Account.</i>
            </h2>
            <p className="mt-4 text-[var(--color-text-muted)] font-medium text-base sm:text-lg leading-relaxed">
              Join our community and discover unique, handcrafted products from local sellers.
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2">Full Name</label>
                <div className="relative group">
                  <UserRound className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent)] transition-colors" size={18} />
                  <input
                    {...register('fullName', { required: true })}
                    placeholder="Your legal name"
                    className="w-full rounded-2xl border border-[var(--color-sand)] bg-white py-5 pl-16 pr-6 outline-none transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:bg-white text-[var(--color-primary)] font-medium placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                {errors.fullName && <p className="mt-1 text-xs text-rose-500 font-bold ml-2 uppercase tracking-tighter">Full name is required.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent)] transition-colors" size={18} />
                  <input
                    type="email"
                    {...register('email', { required: true })}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-[var(--color-sand)] bg-white py-5 pl-16 pr-6 outline-none transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:bg-white text-[var(--color-primary)] font-medium placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-rose-500 font-bold ml-2 uppercase tracking-tighter">Email is required.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent)] transition-colors" size={18} />
                  <input
                    type="password"
                    {...register('password', { required: true })}
                    placeholder="Create a secure password"
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-[var(--color-sand)] bg-white py-5 pl-16 pr-6 outline-none transition-all focus:border-[var(--color-accent)] focus:ring-4 focus:bg-white text-[var(--color-primary)] font-medium placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-rose-500 font-bold ml-2 uppercase tracking-tighter">Password is required.</p>}
              </div>

              <div className="p-6 rounded-2xl bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/10 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest text-center leading-relaxed">
                We'll send an OTP to verify your identity.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[64px] flex items-center justify-center gap-3 rounded-2xl bg-[var(--color-primary)] py-5 font-bold text-white shadow-xl transition-all hover:bg-black hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-12 pt-12 border-t border-[var(--color-stone)]/10 text-center">
            <p className="text-sm font-medium text-[var(--color-text-muted)]">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors underline underline-offset-8">Login here</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
