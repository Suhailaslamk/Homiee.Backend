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
  const { register, handleSubmit, formState: { errors } } = useForm();

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
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=2000&auto=format&fit=crop" 
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
              Begin your <i className="text-[var(--color-accent)]">Journey</i>
            </h2>
            <p className="mt-4 text-[var(--color-text-muted)] font-medium text-lg">
              Join our community of collectors and discover curated treasures from local artisans.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-1">Full Name</label>
              <div className="relative group">
                <UserRound className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent)] transition-colors" size={20} />
                <input
                  {...register('fullName', { required: true })}
                  placeholder="Your full name"
                  className="w-full rounded-2xl border border-[var(--color-stone)]/10 bg-[var(--color-sand)]/5 py-5 pl-16 pr-6 outline-none transition-all focus:border-[var(--color-accent)] focus:bg-white text-[var(--color-text-main)] font-medium"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-rose-500 font-bold ml-1">Full name is required.</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent)] transition-colors" size={20} />
                <input
                  type="email"
                  {...register('email', { required: true })}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-[var(--color-stone)]/10 bg-[var(--color-sand)]/5 py-5 pl-16 pr-6 outline-none transition-all focus:border-[var(--color-accent)] focus:bg-white text-[var(--color-text-main)] font-medium"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-500 font-bold ml-1">Email is required.</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent)] transition-colors" size={20} />
                <input
                  type="password"
                  {...register('password', { required: true })}
                  placeholder="Create a secure password"
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-[var(--color-stone)]/10 bg-[var(--color-sand)]/5 py-5 pl-16 pr-6 outline-none transition-all focus:border-[var(--color-accent)] focus:bg-white text-[var(--color-text-main)] font-medium"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-500 font-bold ml-1">Password is required.</p>}
            </div>

            <div className="p-6 rounded-3xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-xs font-bold text-[var(--color-accent)] uppercase tracking-widest text-center">
              We'll send an OTP to verify your email.
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[var(--color-primary-dark)] py-5 font-bold text-white shadow-xl shadow-[var(--color-primary-dark)]/20 transition hover:bg-[var(--color-primary)] active:scale-[0.98] group"
            >
              Create Account
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-12 pt-12 border-t border-[var(--color-stone)]/10 text-center">
            <p className="text-sm font-medium text-[var(--color-text-muted)]">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[var(--color-primary-dark)] hover:text-[var(--color-accent)] transition-colors underline underline-offset-4">Log in here</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
