import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
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
        navigate('/login');
      } else {
        toast.error(response.data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 pt-24">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Create Customer Account</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Full Name</label>
            <input {...register("fullName", { required: true })} className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">Full name is required.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email Address</label>
            <input type="email" {...register("email", { required: true })} className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
            {errors.email && <p className="mt-1 text-xs text-red-500">Email is required.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input type="password" {...register("password", { required: true })} className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
            {errors.password && <p className="mt-1 text-xs text-red-500">Password is required.</p>}
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition duration-300">
            Sign Up
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-emerald-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
