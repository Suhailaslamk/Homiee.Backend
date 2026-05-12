import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Clock, Upload, ChevronRight, ChevronLeft, Building2, UserCheck, CreditCard, ShieldCheck, Home, ArrowRight, Sparkles, Loader2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { getProfile } from '../api/profile';
import { useToast } from '../hooks/useToast';
import MapPicker from '../components/MapPicker';

const STEPS = [
  { id: 1, title: 'Business Essence', icon: Building2, subtitle: 'Tell us about your craft and store', fields: ['businessName', 'gstNumber', 'address', 'city', 'state', 'pincode'] },
  { id: 2, title: 'Identity & Trust', icon: UserCheck, subtitle: 'Verifying the artisan behind the work', fields: ['sellerName', 'phoneNumber', 'licenseNumber', 'businessProof', 'identityProof'] },
  { id: 3, title: 'Final Dedication', icon: ShieldCheck, subtitle: 'Review and launch your journey', fields: [] },
];

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const { register, reset, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm({
    mode: 'onChange'
  });

  const [isLocating, setIsLocating] = useState(false);

  const { data: profileResponse, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['profile', 'seller-onboarding'],
    queryFn: async () => {
      try {
        const response = await getProfile();
        return response;
      } catch (err) {
        console.warn('Profile sync disturbance handled. Manual bypass available.');
        return null; // Return null to avoid 'isError' being true if we want it silent
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

        // Optional: Simple reverse geocoding mock/logic
        // In a real app, you'd call a geocoding API here.
        // For now, we set the coordinates and let the user know.
        toast.success(`Coordinates pinpointed: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(true);
        toast.error('Unable to retrieve your location.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (isLoading && !isBypassed) return <CenteredState title="Preparing your workspace..." description="Arranging the tools for your journey." icon={<Loader2 size={48} className="animate-spin text-[var(--color-primary)]" />} />;
  
  const showDisturbance = isError && !isBypassed;

  if (showDisturbance) {
    return (
      <CenteredState
        title="Sync Disturbance"
        description={error?.response?.data?.message || "We encountered a technical disturbance while fetching your artisan profile. This often happens if your studio dossier is still being initialized."}
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
            Proceed to Onboarding Form anyway
          </button>
        </div>
      </CenteredState>
    );
  }
  
  if (sellerStatus === 'Submitted') {
    return (
      <CenteredState
        title="Review in Progress"
        description="Our curators are currently reviewing your application. This usually takes 24-48 hours."
        icon={<Clock size={48} className="text-[var(--color-accent)] animate-pulse" />}
      >
        <div className="space-y-4">
          <button onClick={() => refetch()} className="w-full rounded-2xl bg-[var(--color-primary-dark)] py-5 font-bold text-white shadow-xl shadow-[var(--color-primary-dark)]/20 transition hover:bg-[var(--color-primary)]">
            Refresh Status
          </button>
          <Link to="/" className="block text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary-dark)] transition-colors">
            Return to Marketplace
          </Link>
        </div>
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
      toast.error('Please fulfill the artisan requirements before proceeding.');
    }
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-[var(--color-background)] selection:bg-[var(--color-accent)] selection:text-white pt-32 pb-24 px-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[var(--color-sand)]/50 to-transparent pointer-events-none" />
      <div className="absolute top-40 right-[-10%] w-[40vw] h-[40vw] bg-[var(--color-accent)]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        <header className="mb-16 text-center lg:text-left flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-dark)] text-white text-[10px] font-bold uppercase tracking-widest mb-6">
              <Sparkles size={14} /> Artisan Onboarding
            </div>
            <h1 className="text-5xl lg:text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight">
              Launch your <i className="text-[var(--color-accent)]">Studio.</i>
            </h1>
            <p className="mt-4 text-lg text-[var(--color-text-muted)] font-medium max-w-xl">
              Complete these steps to verify your craft and begin reaching thousands of local collectors.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            {STEPS.map((s) => (
              <div key={s.id} className={`w-3 h-3 rounded-full transition-all duration-500 ${currentStep >= s.id ? 'bg-[var(--color-primary)] w-8' : 'bg-[var(--color-stone)]/20'}`} />
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-12">
          {/* Sidebar Navigation */}
          <aside className="space-y-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <button
                  key={step.id}
                  disabled={!isCompleted && !isActive}
                  onClick={() => isCompleted && setCurrentStep(step.id)}
                  className={`w-full text-left p-6 rounded-[2rem] transition-all border ${
                    isActive 
                      ? 'bg-white border-[var(--color-primary)] shadow-xl shadow-[var(--color-primary)]/5 translate-x-2' 
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
          <main className="bg-white rounded-[48px] p-8 sm:p-12 shadow-2xl border border-[var(--color-stone)]/10 min-h-[600px] flex flex-col">
            <div className="mb-12">
              <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-2">
                {STEPS[currentStep - 1].title}
              </h2>
              <p className="text-[var(--color-text-muted)] font-medium">
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
                      <Field label="Business Moniker" error={errors.businessName}>
                        <input {...register('businessName', { required: 'Business name is required' })} className="form-input" placeholder="e.g. The Clay Sanctuary" />
                      </Field>
                      <Field label="GSTIN / Tax Identity" error={errors.gstNumber}>
                        <input {...register('gstNumber', { required: 'Tax ID is required' })} className="form-input" placeholder="15-digit registration" />
                      </Field>
                      <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary-dark)]">Studio Location</label>
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
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary-dark)]">Studio Blueprint</label>
                        <MapPicker 
                          initialPosition={watch('latitude') && watch('longitude') ? [watch('latitude'), watch('longitude')] : null}
                          onLocationSelected={(lat, lng) => {
                            setValue('latitude', lat);
                            setValue('longitude', lng);
                          }}
                          className="h-80"
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Field label="Artisan Full Name" error={errors.sellerName}>
                        <input {...register('sellerName', { required: 'Your name is required' })} className="form-input" placeholder="As it appears on identity" />
                      </Field>
                      <Field label="Liaison Phone" error={errors.phoneNumber}>
                        <input {...register('phoneNumber', { required: 'Phone is required' })} className="form-input" placeholder="10-digit primary contact" />
                      </Field>
                      <Field label="Artisan ID / License" error={errors.licenseNumber}>
                        <input {...register('licenseNumber', { required: 'License is required' })} className="form-input" placeholder="PAN or Registration number" />
                      </Field>
                      <div className="md:col-span-2 space-y-8 mt-4">
                        <UploadField label="Business Registration Proof" register={register('businessProof', { required: sellerStatus !== 'Rejected' })} error={errors.businessProof} />
                        <UploadField label="Personal Identity Proof" register={register('identityProof', { required: sellerStatus !== 'Rejected' })} error={errors.identityProof} />
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
                        Your application will be curated by our team. By submitting, you agree to our premium artisan standards.
                      </p>
                      
                      <div className="bg-[var(--color-sand)]/10 p-8 rounded-[2.5rem] text-left border border-[var(--color-stone)]/5">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-6">Application Summary</h4>
                        <div className="grid grid-cols-2 gap-y-4 text-sm font-medium">
                          <span className="text-[var(--color-text-muted)]">Studio</span>
                          <span className="text-[var(--color-primary-dark)] font-bold">{watch('businessName')}</span>
                          <span className="text-[var(--color-text-muted)]">Lead Artisan</span>
                          <span className="text-[var(--color-primary-dark)] font-bold">{watch('sellerName')}</span>
                          <span className="text-[var(--color-text-muted)]">GSTIN</span>
                          <span className="text-[var(--color-primary-dark)] font-bold">{watch('gstNumber')}</span>
                          <span className="text-[var(--color-text-muted)]">Liaison</span>
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
                    Continue Journey
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button type="submit" className="flex items-center gap-3 px-12 py-5 rounded-2xl bg-[var(--color-accent)] text-white font-bold hover:bg-[var(--color-accent-light)] transition-all shadow-xl shadow-[var(--color-accent)]/20 active:scale-95">
                    Submit for Curation
                    <CheckCircle size={20} />
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
        <p className="text-sm font-bold text-[var(--color-primary-dark)] mb-1">Upload Archive</p>
        <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest">PDF, JPG or PNG (Max 5MB)</p>
        <input type="file" {...register} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png" />
      </div>
      {error && <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-2">Archive is required</p>}
    </div>
  );
}

function CenteredState({ title, description, icon, children }) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full text-center bg-white p-16 rounded-[48px] shadow-2xl border border-[var(--color-stone)]/5"
      >
        <div className="mx-auto mb-10 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-[var(--color-sand)]/30 border border-[var(--color-sand)]">
          {icon || <CheckCircle size={48} className="text-[var(--color-primary)]" />}
        </div>
        <h2 className="text-4xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">{title}</h2>
        <p className="text-lg text-[var(--color-text-muted)] font-medium mb-12 leading-relaxed">{description}</p>
        {children}
      </motion.div>
    </div>
  );
}
