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
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6efe6] flex flex-col items-center justify-center p-6 pt-28 pb-16">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f4d6c8] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#8f3d21] mb-8">
            <Truck size={14} />
            Partner with Homiee
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-stone-900 tracking-tight leading-tight mb-6">
            Help us bridge the gap from <span className="text-[#b85c38]">home to heart.</span>
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
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

          <SurfaceCard className="border-[#e8c9ba] bg-[#fffaf2] p-8 sm:p-10 shadow-2xl shadow-stone-300/40 order-1 lg:order-2">
            <h2 className="text-2xl font-black text-stone-900 mb-8">Partner Registration</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-stone-700 uppercase tracking-wider">Full Name</label>
                <input
                  {...register('fullName', { required: true })}
                  placeholder="Enter your legal name"
                  className="w-full rounded-2xl border border-[#ecd9cd] bg-[#fff7ee] px-5 py-4 text-stone-800 outline-none transition focus:border-[#d36f51] focus:ring-2 focus:ring-[#f0c7b7]"
                />
                {errors.fullName && <p className="text-xs font-bold text-rose-600 ml-1">Legal name is required for verification.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-stone-700 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  {...register('email', { required: true })}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-[#ecd9cd] bg-[#fff7ee] px-5 py-4 text-stone-800 outline-none transition focus:border-[#d36f51] focus:ring-2 focus:ring-[#f0c7b7]"
                />
                {errors.email && <p className="text-xs font-bold text-rose-600 ml-1">Valid email is required.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-stone-700 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  {...register('password', { required: true, minLength: 6 })}
                  placeholder="At least 6 characters"
                  className="w-full rounded-2xl border border-[#ecd9cd] bg-[#fff7ee] px-5 py-4 text-stone-800 outline-none transition focus:border-[#d36f51] focus:ring-2 focus:ring-[#f0c7b7]"
                />
                {errors.password && <p className="text-xs font-bold text-rose-600 ml-1">Password (min 6 chars) is required.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-stone-700 uppercase tracking-wider">Vehicle Type</label>
                <input
                  {...register('vehicleType', { required: true })}
                  placeholder="Bike, Scooter, Car..."
                  className="w-full rounded-2xl border border-[#ecd9cd] bg-[#fff7ee] px-5 py-4 text-stone-800 outline-none transition focus:border-[#d36f51] focus:ring-2 focus:ring-[#f0c7b7]"
                />
                {errors.vehicleType && <p className="text-xs font-bold text-rose-600 ml-1">Please specify your delivery vehicle.</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-[#3f5143] py-5 font-bold text-white shadow-lg transition hover:bg-[#334237] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {isSubmitting ? 'Registering...' : 'Start Onboarding'}
              </button>
              
              <p className="text-center text-sm text-stone-500 mt-4 font-medium">
                Already a partner? <Link to="/login" className="text-[#b85c38] font-bold hover:underline">Log in here</Link>
              </p>
            </form>
          </SurfaceCard>
        </div>

        <div className="mt-16 flex justify-center">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-3 text-stone-500 hover:text-stone-900 font-bold transition group"
          >
            <div className="p-2 rounded-xl bg-white border border-[#e8c9ba] group-hover:bg-[#fff7ee] transition">
              <ArrowLeft size={18} />
            </div>
            Back to Marketplace
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
