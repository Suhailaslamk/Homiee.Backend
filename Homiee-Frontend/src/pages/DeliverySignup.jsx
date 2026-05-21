import React from 'react';
import { useForm } from 'react-hook-form';
import { Truck, ArrowLeft, ShieldCheck, MapPin, BadgeCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import SurfaceCard from '../components/SurfaceCard';

export default function DeliverySignup() {
  const navigate = useNavigate();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/auth/register/delivery', data);

      if (response.data?.isSuccess) {
        toast.success('Registration successful. Please check your email for verification.');
        navigate('/verify-email', { state: { email: data.email } });
        return;
      }

      toast.error(response.data?.message || 'Registration failed.');
    } catch (err) {
      console.error('Delivery registration failed:', err);
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
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-6 pt-28 pb-16 relative overflow-hidden"
         style={{ background: 'radial-gradient(circle at top right, var(--color-background) 0%, #f0ede7 100%)' }}>
      {/* Decorative Blobs */}
      <div className="absolute top-[10%] left-[10%] w-[30vw] h-[30vw] bg-[var(--color-accent)]/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-[var(--color-primary)]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-5xl w-full relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)]/10 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] mb-8 border border-[var(--color-accent)]/10 shadow-inner">
            <Truck size={14} />
            Partner with Homiee
          </div>
          <h1 className="text-4xl sm:text-7xl font-['Fraunces'] font-semibold text-[var(--color-primary)] tracking-[-0.03em] leading-[1.1] mb-8">
            Join our <i className="text-[var(--color-accent)]">Delivery Team.</i>
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto leading-relaxed font-medium">
            Join our local delivery network. Help home-based businesses reach their neighbors while earning on your own schedule.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8 order-2 lg:order-1">
            <FeatureItem 
              icon={BadgeCheck} 
              title="Verified Partnerships" 
              description="Connect with trusted local creators and deliver high-quality handmade products."
              tone="forest"
            />
            <FeatureItem 
              icon={MapPin} 
              title="Local Routes" 
              description="Focus on your community. Short distances, familiar neighborhoods, and sustainable deliveries."
              tone="terracotta"
            />
            <FeatureItem 
              icon={ShieldCheck} 
              title="Secure Platform" 
              description="Transparent earnings, automated payouts, and dedicated support for every trip."
              tone="forest"
            />
          </div>

          <div className="glass rounded-[3rem] p-10 sm:p-12 shadow-[0_40px_80px_-16px_rgba(26,46,26,0.1)] border border-white/60 order-1 lg:order-2">
            <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary)] mb-10 tracking-tight">Partner Sign Up</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2">Full Name</label>
                <input
                  {...register('fullName', { required: true })}
                  placeholder="Enter your legal name"
                  className="w-full rounded-2xl border border-[var(--color-sand)] bg-white px-6 py-5 text-[var(--color-primary)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:bg-white font-medium"
                />
                {errors.fullName && <p className="text-xs font-bold text-rose-600 ml-2 uppercase tracking-tighter mt-1">Legal name is required.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2">Email Address</label>
                <input
                  type="email"
                  {...register('email', { required: true })}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-[var(--color-sand)] bg-white px-6 py-5 text-[var(--color-primary)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:bg-white font-medium"
                />
                {errors.email && <p className="text-xs font-bold text-rose-600 ml-2 uppercase tracking-tighter mt-1">Valid email is required.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2">Password</label>
                <input
                  type="password"
                  {...register('password', { required: true, minLength: 6 })}
                  placeholder="At least 6 characters"
                  className="w-full rounded-2xl border border-[var(--color-sand)] bg-white px-6 py-5 text-[var(--color-primary)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:bg-white font-medium"
                />
                {errors.password && <p className="text-xs font-bold text-rose-600 ml-2 uppercase tracking-tighter mt-1">Password (min 6 chars) is required.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] ml-2">Vehicle Type</label>
                <input
                  {...register('vehicleType', { required: true })}
                  placeholder="Bike, Scooter, Car..."
                  className="w-full rounded-2xl border border-[var(--color-sand)] bg-white px-6 py-5 text-[var(--color-primary)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:bg-white font-medium"
                />
                {errors.vehicleType && <p className="text-xs font-bold text-rose-600 ml-2 uppercase tracking-tighter mt-1">Specify your vehicle.</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[64px] flex items-center justify-center gap-3 rounded-2xl bg-[var(--color-primary)] py-5 font-bold text-white shadow-xl transition-all hover:bg-black hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Create Account'
                )}
              </button>
              
              <p className="text-center text-sm text-[var(--color-text-muted)] mt-6 font-medium">
                Already a partner? <Link to="/login" className="text-[var(--color-primary)] font-bold hover:text-[var(--color-accent)] transition-colors underline underline-offset-8">Login here</Link>
              </p>
            </form>
          </div>
        </div>

        <div className="mt-16 flex justify-center">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-3 text-stone-500 hover:text-stone-900 font-bold transition group"
          >
            <div className="p-2 rounded-xl bg-white border border-[#e8c9ba] group-hover:bg-[#fff7ee] transition">
              <ArrowLeft size={18} />
            </div>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, description, tone }) {
  const tones = {
    forest: 'bg-[#e3eee5] text-[#3f5143]',
    terracotta: 'bg-[#f4d6c8] text-[#b85c38]',
  };

  return (
    <div className="flex gap-5 items-start">
      <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${tones[tone]}`}>
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-xl font-black text-stone-900 mb-2">{title}</h3>
        <p className="text-sm leading-7 text-stone-600 font-medium">{description}</p>
      </div>
    </div>
  );
}
