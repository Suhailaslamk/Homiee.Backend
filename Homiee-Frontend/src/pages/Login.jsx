import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Lock, Mail } from 'lucide-react';
import api from '../api/axios';
import { getProfile } from '../api/profile';
import { useToast } from '../hooks/useToast';
import { getCurrentRole, getDefaultAuthenticatedPath, isSellerRole } from '../utils/auth';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const toast = useToast();

  const onSubmit = async (data) => {
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
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
      <div className="w-full max-w-md rounded-[28px] border border-stone-200 bg-[#fffaf2] p-10 shadow-xl shadow-stone-200/40">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#f4d6c8] text-[#b85c38]">
            <Home size={30} />
          </div>
          <h2 className="text-3xl font-bold text-stone-800">Welcome to Homiee</h2>
          <p className="mt-2 text-stone-500">Log in to manage your home business journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-stone-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-stone-400" size={18} />
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-stone-200 bg-[#fff7ee] py-3 pl-10 pr-4 outline-none transition-all focus:border-[#d36f51] focus:ring-2 focus:ring-[#f0c7b7] focus:bg-white"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-stone-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-stone-400" size={18} />
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                placeholder="********"
                className="w-full rounded-xl border border-stone-200 bg-[#fff7ee] py-3 pl-10 pr-4 outline-none transition-all focus:border-[#d36f51] focus:ring-2 focus:ring-[#f0c7b7] focus:bg-white"
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-stone-600">
              <input type="checkbox" className="mr-2 rounded border-stone-300 text-[#b85c38] focus:ring-[#d36f51]" />
              Remember me
            </label>
            <span className="font-medium text-[#b85c38]">Verified accounts only</span>
          </div>

          <button type="submit" className="w-full rounded-xl bg-[#3f5143] py-3.5 font-bold text-white shadow-lg transition hover:bg-[#334237] active:scale-[0.98]">
            Sign In
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-stone-600">
          Don&apos;t have an account?{' '}
          <Link to="/" className="font-bold text-[#b85c38] hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
