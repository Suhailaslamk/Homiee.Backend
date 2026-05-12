import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';

const RESEND_COOLDOWN = 60;

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCooldown((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (otp.length === 6 && !isSubmitting) {
      handleVerify(new Event('submit'));
    }
  }, [otp, isSubmitting]);

  const handleVerify = async (event) => {
    if (event) event.preventDefault();

    if (!email) {
      toast.error('Registration email is missing. Please return to signup.');
      return;
    }

    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP from your email.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/verify-email', { email, otp });

      if (response.data && response.data.isSuccess) {
        toast.success('Email verified successfully. You can now log in.');
        navigate('/login', { replace: true });
      } else {
        const msg = response.data?.message || 'Verification failed. Please try again.';
        toast.error(msg);
      }
    } catch (error) {
      console.error('Email verification failed:', error);
      const errorMessage = error.response?.data?.message || 'Verification failed. Please check your OTP.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || cooldown > 0) {
      return;
    }

    setIsResending(true);

    try {
      const response = await api.post('/auth/resend-otp', { email });

      if (response.data?.isSuccess) {
        toast.success('A fresh OTP is on its way to your inbox.');
        setCooldown(RESEND_COOLDOWN);
        return;
      }

      toast.error(response.data?.message || 'Unable to resend OTP right now.');
    } catch (error) {
      console.error('OTP resend failed:', error);
      toast.error(error.response?.data?.message || 'Unable to resend OTP right now.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4 pt-24">
      <div className="w-full max-w-md rounded-[28px] border border-stone-200 bg-[#fff7ee] p-10 shadow-xl shadow-stone-200/40">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#f4d6c8] text-[#b85c38]">
            <MailCheck size={30} />
          </div>
          <h2 className="text-3xl font-black text-stone-800">Verify your email</h2>
          <p className="mt-2 text-sm text-stone-500">
            Enter the 6-digit OTP we sent to
            <span className="ml-1 font-bold text-stone-700">{email || 'your registered email'}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-stone-700">6-digit OTP</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full rounded-2xl border border-stone-200 bg-[#fff7ee] px-4 py-3 text-center text-2xl font-black tracking-[0.5em] text-stone-800 outline-none transition-all focus:border-[#d36f51] focus:ring-2 focus:ring-[#f0c7b7] focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[#3f5143] py-3.5 font-semibold text-white shadow-lg transition hover:bg-[#334237] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-[#e8c9ba] bg-[#fff7ee] p-4 text-sm text-stone-600">
          Didn&apos;t receive the code? Check spam or request a new OTP after the cooldown.
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 text-sm">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={!email || cooldown > 0 || isResending}
            className="font-bold text-[#b85c38] transition hover:text-[#d36f51] disabled:cursor-not-allowed disabled:text-stone-400"
          >
            {isResending ? 'Sending...' : cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
          </button>

          <Link to="/login" className="font-semibold text-stone-500 hover:text-stone-700">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
