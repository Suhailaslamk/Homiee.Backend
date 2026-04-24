import React from 'react';
import { useForm } from 'react-hook-form';
import { Truck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';

export default function DeliverySignup() {
  const navigate = useNavigate();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/auth/register/delivery', data);

      if (response.data?.isSuccess) {
        toast.success('Registration successful. Please check your email for verification.');
        navigate('/login');
        return;
      }

      toast.error(response.data?.message || 'Registration failed.');
    } catch (err) {
      console.error('Delivery registration failed:', err);
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 pt-24">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12">
            <Truck size={48} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4">
            Join the <span className="text-amber-500">Delivery Network</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
            Create your delivery partner account and we will guide you through verification after email confirmation.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <input
                {...register('fullName', { required: true })}
                className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">Full name is required.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                {...register('email', { required: true })}
                className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">Email is required.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                {...register('password', { required: true })}
                className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">Password is required.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Vehicle Type</label>
              <input
                {...register('vehicleType', { required: true })}
                placeholder="Bike, Scooter, Van..."
                className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
              />
              {errors.vehicleType && <p className="mt-1 text-xs text-red-500">Vehicle type is required.</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition shadow-lg"
            >
              Create Delivery Account
            </button>
          </form>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="mt-12 inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold transition"
        >
          <ArrowLeft size={18} /> Back to Marketplace
        </button>
      </div>
    </div>
  );
}
