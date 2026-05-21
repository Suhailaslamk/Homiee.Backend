import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Clock, Upload, ChevronRight, ChevronLeft, Building2, UserCheck, CreditCard, ShieldCheck, Home, ArrowRight, Sparkles, Loader2, MapPin, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { getProfile } from '../api/profile';
import { useToast } from '../hooks/useToast';
import MapPicker from '../components/MapPicker';

const STEPS = [
  { id: 1, title: 'Shop Info', icon: Building2, subtitle: 'Tell us about your store and location', fields: ['businessName', 'gstNumber', 'address', 'city', 'state', 'pincode'] },
  { id: 2, title: 'Identity', icon: UserCheck, subtitle: 'Verify your identification', fields: ['sellerName', 'phoneNumber', 'licenseNumber', 'businessProof', 'identityProof'] },
  { id: 3, title: 'Submit', icon: ShieldCheck, subtitle: 'Review and submit your application', fields: [] },
];

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const { register, reset, handleSubmit, watch, setValue, trigger, formState: { errors, isSubmitting } } = useForm({
    mode: 'onChange'
  });

  const [isLocating, setIsLocating] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const { data: profileResponse, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['profile', 'seller-onboarding'],
    queryFn: async () => {
      try {
        const response = await getProfile();
        return response;
      } catch (err) {
        console.warn('Connection issue. Manual bypass available.');
        return null; 
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const profile = profileResponse?.data;
  const seller = profile?.seller;
  const sellerStatus = seller?.status;

  const isBypassed = new URLSearchParams(window.location.search).get('bypass') === 'true';

  useEffect(() => {
    if (sellerStatus === 'Approved') {
      navigate('/seller/dashboard', { replace: true });
    }
  }, [navigate, sellerStatus]);

  useEffect(() => {
    if (seller) {
      reset({
        sellerName: profile?.name ?? '',
        businessName: seller.businessName ?? '',
        phoneNumber: seller.phoneNumber ?? '',
        address: seller.address ?? '',
        gstNumber: seller.gstNumber ?? '',
        city: seller.city ?? '',
        state: seller.state ?? '',
        pincode: seller.pincode ?? '',
        licenseNumber: seller.licenseNumber ?? '',
      });
    }
  }, [profile?.name, reset, seller]);

  const submitProfile = async (data) => {
    const isRejected = sellerStatus === 'Rejected';
    const endpoint = isRejected ? '/seller/resubmit' : '/seller/complete-profile';
    
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof FileList) {
          if (value[0]) formData.append(key, value[0]);
          return;
        }
        formData.append(key, value ?? '');
      });

      await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await refetch();
      toast.success(isRejected ? 'Profile resubmitted for review.' : 'Profile submitted for verification.');
    } catch (err) {
      console.error('Onboarding failed:', err);
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    }
  };

  const fetchAddressDetails = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || '';
        const state = addr.state || '';
        const pincode = addr.postcode || addr.postal_code || '';
        const fullAddress = data.display_name || '';

        const setOptions = { shouldValidate: true, shouldDirty: true, shouldTouch: true };
        
        setValue('address', fullAddress, setOptions);
        if (city) setValue('city', city, setOptions);
        if (state) setValue('state', state, setOptions);
        if (pincode) {
          // Some postcodes come with spaces or extra info, let's clean it for Indian context if possible
          const cleanedPincode = pincode.replace(/\s/g, '').match(/\d{6}/)?.[0] || pincode;
          setValue('pincode', cleanedPincode, setOptions);
        }
        
        toast.success('Address details updated from map.');
      }
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setValue('latitude', latitude);
        setValue('longitude', longitude);

        await fetchAddressDetails(latitude, longitude);
        setIsLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        toast.error('Unable to retrieve your location.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (isLoading && !isBypassed) return <CenteredState title="Loading..." description="Please wait while we prepare your application." icon={<Loader2 size={48} className="animate-spin text-[var(--color-primary)]" />} />;
  
  const showDisturbance = isError && !isBypassed;

  if (showDisturbance) {
    return (
      <CenteredState
        title="Sync Error"
        description={error?.response?.data?.message || "We couldn't sync your profile. This might be a temporary connection issue."}
        icon={<AlertTriangle size={48} className="text-rose-500" />}
      >
        <div className="space-y-4">
          <button onClick={() => refetch()} className="w-full rounded-2xl bg-[var(--color-primary-dark)] py-5 font-bold text-white shadow-xl transition hover:bg-[var(--color-primary)]">
            Retry Synchronization
          </button>
          <button 
            onClick={() => {
              window.location.href = window.location.pathname + '?bypass=true';
            }} 
            className="w-full py-5 rounded-2xl border-2 border-[var(--color-stone)]/10 text-sm font-bold text-[var(--color-primary-dark)] hover:bg-[var(--color-sand)]/30 transition-all"
          >
            Continue to Form
          </button>
        </div>
      </CenteredState>
    );
  }
  
  if (sellerStatus === 'Rejected' && !isResubmitting) {
    return (
      <CenteredState
        title="Application Rejected"
        description={`Your application was not approved at this time. Reason: ${seller?.rejectionReason || 'Not specified.'}`}
        icon={<AlertTriangle size={48} className="text-rose-500" />}
      >
        <div className="space-y-6">
          <button 
            onClick={() => setIsResubmitting(true)}
            className="w-full h-[64px] flex items-center justify-center rounded-2xl bg-[var(--color-primary)] font-bold text-white shadow-xl shadow-[var(--color-primary)]/20 transition-all hover:bg-black hover:-translate-y-0.5 active:translate-y-0"
          >
            Edit and Resubmit Application
          </button>
          <Link to="/" className="block text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors tracking-wide">
            Return to Marketplace
          </Link>
        </div>
        <SupportShortcut />
      </CenteredState>
    );
  }

  if (sellerStatus === 'Submitted') {
    return (
      <CenteredState
        title="Review in Progress"
        description="Our team is currently reviewing your application. You will receive an email once your account is ready."
        icon={<Clock size={48} className="text-[var(--color-accent)]" />}
        pulsing
      >
        <div className="space-y-14">
          {/* Progress Stepper */}
          <div className="flex items-center justify-between max-w-xs mx-auto relative px-2">
            <div className="absolute top-4 left-0 w-full h-[1px] bg-[var(--color-sand)] z-0" />
            <div className="absolute top-4 left-0 w-1/2 h-[1px] bg-[var(--color-accent)] z-0" />
            
            <Step status="complete" label="Submitted" />
            <Step status="active" label="Review" />
            <Step status="upcoming" label="Launch" />
          </div>

          <div className="space-y-6">
            <button 
              onClick={async () => {
                const btn = document.getElementById('refresh-btn');
                if (btn) btn.innerHTML = '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>';
                await refetch();
                setTimeout(() => {
                  if (btn) btn.innerHTML = 'Refresh Status';
                }, 1000);
              }} 
              id="refresh-btn"
              className="w-full h-[64px] flex items-center justify-center rounded-2xl bg-[var(--color-primary)] font-bold text-white shadow-xl shadow-[var(--color-primary)]/20 transition-all hover:bg-black hover:-translate-y-0.5 active:translate-y-0"
            >
              Refresh Status
            </button>
            <Link to="/" className="block text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors tracking-wide">
              Return to Marketplace
            </Link>
          </div>
        </div>
        <SupportShortcut />
      </CenteredState>
    );
  }

  const nextStep = async () => {
    const fields = STEPS[currentStep - 1].fields;
    console.log('Validating fields for step:', currentStep, fields);
    const isValid = await trigger(fields);
    console.log('Validation result:', isValid, errors);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    } else {
      toast.error('Please complete all required fields before proceeding.');
    }
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-[var(--color-background)] selection:bg-[var(--color-accent)] selection:text-white pt-32 pb-24 px-6 relative overflow-hidden"
         style={{ background: 'radial-gradient(circle at top right, var(--color-background) 0%, #f0ede7 100%)' }}>
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[var(--color-sand)]/30 to-transparent pointer-events-none" />
      <div className="absolute top-40 right-[-10%] w-[40vw] h-[40vw] bg-[var(--color-accent)]/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-40 left-[-10%] w-[30vw] h-[30vw] bg-[var(--color-primary)]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-16 text-center lg:text-left flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-dark)] text-white text-[10px] font-bold uppercase tracking-widest mb-6">
              <Store size={14} /> Official Marketplace Seller
            </div>
            <h1 className="text-4xl lg:text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight">
              Start your <i className="text-[var(--color-accent)]">Shop.</i>
            </h1>
            <p className="mt-4 text-base lg:text-lg text-[var(--color-text-muted)] font-medium max-w-xl">
              Complete these steps to verify your account and start selling.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            {STEPS.map((s) => (
              <div key={s.id} className={`w-3 h-3 rounded-full transition-all duration-500 ${currentStep >= s.id ? 'bg-[var(--color-primary)] w-8' : 'bg-[var(--color-stone)]/20'}`} />
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-12 items-start">
          {/* Sidebar Navigation */}
          <aside className="flex flex-row lg:flex-col gap-4 overflow-x-auto pb-4 no-scrollbar lg:overflow-visible lg:pb-0">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <button
                  key={step.id}
                  disabled={!isCompleted && !isActive}
                  onClick={() => isCompleted && setCurrentStep(step.id)}
                  className={`flex-shrink-0 lg:w-full text-left p-6 rounded-[2rem] transition-all border min-w-[240px] lg:min-w-0 ${
                    isActive 
                      ? 'bg-white border-[var(--color-primary)] shadow-xl shadow-[var(--color-primary)]/5 lg:translate-x-2' 
                      : isCompleted
                      ? 'bg-[var(--color-sand)]/30 border-transparent text-[var(--color-primary)] opacity-80'
                      : 'bg-transparent border-transparent text-[var(--color-text-muted)] opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-[var(--color-primary)] text-white' : 'bg-white/50 text-[var(--color-text-muted)]'}`}>
                      {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Step 0{step.id}</div>
                      <div className="font-bold text-sm tracking-tight">{step.title}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Form Content Area */}
          <main className="glass rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-16 shadow-[0_40px_80px_-16px_rgba(26,46,26,0.1)] border border-white/60 min-h-[600px] flex flex-col transition-all duration-500">
            <div className="mb-14">
              <h2 className="text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary)] mb-4 tracking-[-0.02em]">
                {STEPS[currentStep - 1].title}
              </h2>
              <p className="text-[var(--color-text-muted)] font-medium text-base leading-relaxed">
                {STEPS[currentStep - 1].subtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit(submitProfile)} className="flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex-1"
                >
                  {currentStep === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Field label="Shop Name" error={errors.businessName}>
                        <input {...register('businessName', { required: 'Shop name is required' })} className="form-input" placeholder="e.g. The Clay Sanctuary" />
                      </Field>
                      <Field label="Tax Number (GST)" error={errors.gstNumber}>
                        <input {...register('gstNumber', { required: 'Tax ID is required' })} className="form-input" placeholder="15-digit registration" />
                      </Field>
                      <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary-dark)]">Shop Location</label>
                          <button
                            type="button"
                            onClick={handleLocateMe}
                            disabled={isLocating}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-sand)]/30 text-[var(--color-primary-dark)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--color-sand)] transition-all disabled:opacity-50"
                          >
                            <MapPin size={14} className={isLocating ? "animate-pulse" : ""} />
                            {isLocating ? "Pinpointing..." : "Pin My Location"}
                          </button>
                        </div>
                        <Field error={errors.address}>
                          <textarea {...register('address', { required: 'Address is required' })} className="form-input min-h-[120px]" placeholder="Where your creations come to life" />
                        </Field>
                      </div>
                      
                      <Field label="City of Origin" error={errors.city}>
                        <input {...register('city', { required: 'City is required' })} className="form-input" placeholder="e.g. Fort Kochi" />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="State" error={errors.state}>
                          <input {...register('state', { required: 'Required' })} className="form-input" placeholder="Kerala" />
                        </Field>
                        <Field label="Pincode" error={errors.pincode}>
                          <input {...register('pincode', { required: 'Required' })} className="form-input" placeholder="682001" />
                        </Field>
                      </div>

                      {/* Hidden coordinates */}
                      <input type="hidden" {...register('latitude')} />
                      <input type="hidden" {...register('longitude')} />

                      <div className="md:col-span-2 space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary-dark)]">Map Location</label>
                        <MapPicker 
                          initialPosition={watch('latitude') && watch('longitude') ? [watch('latitude'), watch('longitude')] : null}
                          onLocationSelected={(lat, lng) => {
                            setValue('latitude', lat);
                            setValue('longitude', lng);
                            fetchAddressDetails(lat, lng);
                          }}
                          className="h-80"
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Field label="Seller Full Name" error={errors.sellerName}>
                        <input {...register('sellerName', { required: 'Your name is required' })} className="form-input" placeholder="As it appears on identity" />
                      </Field>
                      <Field label="Phone Number" error={errors.phoneNumber}>
                        <input {...register('phoneNumber', { required: 'Phone is required' })} className="form-input" placeholder="10-digit primary contact" />
                      </Field>
                      <Field label="License Number" error={errors.licenseNumber}>
                        <input {...register('licenseNumber', { required: 'License is required' })} className="form-input" placeholder="PAN or Registration number" />
                      </Field>
                      <div className="md:col-span-2 space-y-8 mt-4">
                        <UploadField label="Business Registration Proof" register={register('businessProof', { required: sellerStatus !== 'Rejected' })} error={errors.businessProof} />
                        <UploadField label="Personal ID Proof" register={register('identityProof', { required: sellerStatus !== 'Rejected' })} error={errors.identityProof} />
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="text-center py-8">
                      <div className="w-24 h-24 bg-[var(--color-sand)]/30 rounded-full flex items-center justify-center mx-auto mb-8 border border-[var(--color-sand)]">
                        <ShieldCheck size={48} className="text-[var(--color-primary)]" />
                      </div>
                      <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Launch Verification</h2>
                      <p className="text-[var(--color-text-muted)] font-medium max-w-md mx-auto mb-12">
                        Your application will be reviewed by our team. By submitting, you agree to our terms and conditions.
                      </p>
                      
                      <div className="bg-[var(--color-sand)]/10 p-8 rounded-[2.5rem] text-left border border-[var(--color-stone)]/5">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-6">Application Summary</h4>
                        <div className="grid grid-cols-2 gap-y-4 text-sm font-medium">
                          <span className="text-[var(--color-text-muted)]">Shop Name</span>
                          <span className="text-[var(--color-primary-dark)] font-bold">{watch('businessName')}</span>
                          <span className="text-[var(--color-text-muted)]">Full Name</span>
                          <span className="text-[var(--color-primary-dark)] font-bold">{watch('sellerName')}</span>
                          <span className="text-[var(--color-text-muted)]">Tax/GST</span>
                          <span className="text-[var(--color-primary-dark)] font-bold">{watch('gstNumber')}</span>
                          <span className="text-[var(--color-text-muted)]">Phone</span>
                          <span className="text-[var(--color-primary-dark)] font-bold">{watch('phoneNumber')}</span>
                          <span className="text-[var(--color-text-muted)]">City</span>
                          <span className="text-[var(--color-primary-dark)] font-bold">{watch('city')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Controls */}
              <div className="mt-16 flex items-center justify-between gap-6 pt-8 border-t border-[var(--color-stone)]/5">
                <button 
                  type="button" 
                  onClick={prevStep} 
                  disabled={currentStep === 1}
                  className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all ${
                    currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary-dark)] hover:bg-[var(--color-sand)]/30'
                  }`}
                >
                  <ChevronLeft size={20} /> Previous step
                </button>
                
                {currentStep < STEPS.length ? (
                  <button type="button" onClick={nextStep} className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-[var(--color-primary-dark)] text-white font-bold hover:bg-[var(--color-primary)] transition-all shadow-xl shadow-[var(--color-primary-dark)]/20 active:scale-95 group">
                    Continue
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex items-center gap-3 px-12 py-5 rounded-2xl bg-[var(--color-accent)] text-white font-bold hover:bg-[var(--color-accent-light)] transition-all shadow-xl shadow-[var(--color-accent)]/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <CheckCircle size={20} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </main>
        </div>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          padding: 20px 24px;
          background-color: var(--color-sand-light);
          border: 1px solid rgba(var(--color-stone-rgb), 0.1);
          border-radius: 20px;
          outline: none;
          transition: all 0.3s ease;
          font-weight: 500;
          color: var(--color-primary-dark);
          font-size: 15px;
        }
        .form-input:focus {
          background-color: white;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 4px rgba(var(--color-accent-rgb), 0.1);
        }
        .form-input::placeholder {
          color: var(--color-text-muted);
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}

function Field({ label, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-3 ml-2">{label}</label>
      {children}
      {error && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-2">{error.message || 'Required field'}</motion.p>}
    </div>
  );
}

function UploadField({ label, register, error }) {
  return (
    <div className="group">
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-4 ml-2">{label}</label>
      <div className="relative border-2 border-dashed border-[var(--color-stone)]/10 rounded-3xl p-10 text-center hover:border-[var(--color-accent)] hover:bg-[var(--color-sand)]/10 transition-all cursor-pointer">
        <Upload className="mx-auto text-[var(--color-stone)]/30 group-hover:text-[var(--color-accent)] mb-4 transition-colors" size={32} />
        <p className="text-sm font-bold text-[var(--color-primary-dark)] mb-1">Upload File</p>
        <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest">PDF, JPG or PNG (Max 5MB)</p>
        <input type="file" {...register} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png" />
      </div>
      {error && <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-2">File is required</p>}
    </div>
  );
}

function Step({ status, label }) {
  const configs = {
    complete: { bg: 'bg-[var(--color-accent)]', icon: <CheckCircle size={12} className="text-white" /> },
    active: { bg: 'bg-[var(--color-accent)] animate-pulse shadow-[0_0_15px_rgba(242,140,40,0.5)]', icon: <Clock size={12} className="text-white" /> },
    upcoming: { bg: 'bg-[var(--color-sand)]', icon: <div className="w-2 h-2 rounded-full bg-white/50" /> }
  };
  
  return (
    <div className="relative z-10 flex flex-col items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${configs[status].bg} transition-all duration-500`}>
        {configs[status].icon}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider ${status === 'upcoming' ? 'text-[var(--color-text-muted)] opacity-50' : 'text-[var(--color-primary)]'}`}>
        {label}
      </span>
    </div>
  );
}

function SupportShortcut() {
  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <button className="flex items-center gap-3 px-6 py-4 rounded-full bg-white shadow-2xl border border-[var(--color-sand)] hover:shadow-xl transition-all group">
        <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] group-hover:scale-110 transition-transform">
          <Sparkles size={20} />
        </div>
        <div className="text-left">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Need help?</div>
          <div className="text-sm font-bold text-[var(--color-primary)]">Contact Support</div>
        </div>
      </button>
    </div>
  );
}

function CenteredState({ title, description, icon, children, pulsing = false }) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6 relative overflow-hidden" 
         style={{ background: 'radial-gradient(circle at center, var(--color-background) 0%, #f0ede7 100%)' }}>
      {/* Abstract background blobs for premium feel */}
      <div className="absolute top-[10%] left-[10%] w-[30vw] h-[30vw] bg-[var(--color-accent)]/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-[var(--color-primary)]/5 rounded-full blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center glass p-8 sm:p-16 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-[0_40px_80px_-16px_rgba(26,46,26,0.12)] border border-white/60 relative z-10"
      >
        <div className={`mx-auto mb-12 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/10 ${pulsing ? 'animate-pulse' : ''}`}>
          <div className={pulsing ? 'animate-bounce' : ''}>
            {icon || <CheckCircle size={48} className="text-[var(--color-primary)]" />}
          </div>
        </div>
        <h2 className="text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary)] mb-6 leading-[1.1] tracking-[-0.02em]">{title}</h2>
        <p className="text-base text-[var(--color-text-muted)] font-medium mb-12 leading-[1.7] px-2">{description}</p>
        {children}
      </motion.div>
    </div>
  );
}
