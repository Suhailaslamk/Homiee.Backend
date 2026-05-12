import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  BadgeIndianRupee,
  ImagePlus,
  Info,
  Package,
  ShoppingBag,
  Tag,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight,
  PlusCircle,
  ChevronLeft,
  Zap,
  Camera,
  X,
  XCircle,
  Plus,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeImage from '../../components/SafeImage';
import StatePanel from '../../components/StatePanel';
import SurfaceCard from '../../components/SurfaceCard';
import {
  addSellerProductImages,
  createSellerProduct,
  getSellerCategories,
  getSellerProduct,
  updateSellerProduct,
  deleteSellerProductImage,
  setSellerProductPrimaryImage,
} from '../../api/seller';
import { useToast } from '../../hooks/useToast';
import { getResponseData } from '../../utils/api';

const DEFAULT_VALUES = {
  name: '',
  description: '',
  price: '',
  stock: '',
  categoryId: '',
};

export default function ProductForm() {
  const { productId } = useParams();
  const isEdit = Boolean(productId);
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [primaryImage, setPrimaryImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ['seller-categories'],
    queryFn: getSellerCategories,
  });

  const {
    data: productResponse,
    isLoading: productLoading,
    error: productError,
    refetch: refetchProduct,
  } = useQuery({
    queryKey: ['seller-product', productId],
    queryFn: () => getSellerProduct(productId),
    enabled: isEdit,
  });

  const categories = getResponseData(categoriesResponse) ?? [];
  const product = getResponseData(productResponse);

  useEffect(() => {
    if (!isEdit || !product) {
      return;
    }

    reset({
      name: product.name ?? '',
      description: product.description ?? '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      categoryId: product.categoryId ?? '',
    });
    setExistingImages(product.images ?? []);
  }, [isEdit, product, reset]);

  const createMutation = useMutation({
    mutationFn: (formData) => createSellerProduct(formData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['seller-inventory'] });
      toast.success(response?.message || 'Creation listed in studio catalog.');
      navigate('/seller/inventory');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to list creation.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ payload, newGalleryImages }) => {
      const updateResponse = await updateSellerProduct(productId, payload);

      if (newGalleryImages.length > 0) {
        await addSellerProductImages(productId, newGalleryImages);
      }

      return updateResponse;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['seller-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['seller-product', productId] });
      toast.success(response?.message || 'Creation refined successfully.');
      navigate('/seller/inventory');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to refine creation.');
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: deleteSellerProductImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-product', productId] });
      toast.success('Visual removed from dossier.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to remove visual.');
    }
  });

  const setPrimaryImageMutation = useMutation({
    mutationFn: setSellerProductPrimaryImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-product', productId] });
      toast.success('Primary aesthetic updated.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to update primary visual.');
    }
  });

  const primaryPreview = useMemo(
    () => (primaryImage ? URL.createObjectURL(primaryImage) : null),
    [primaryImage]
  );

  const galleryPreviews = useMemo(
    () => galleryImages.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    [galleryImages]
  );

  useEffect(() => {
    return () => {
      if (primaryPreview) {
        URL.revokeObjectURL(primaryPreview);
      }
      galleryPreviews.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [galleryPreviews, primaryPreview]);

  const onSubmit = handleSubmit((values) => {
    if (!isEdit && !primaryImage) {
      toast.error('Please curation a primary aesthetic image for your piece.');
      return;
    }

    if (isEdit) {
      updateMutation.mutate({
        payload: {
          name: values.name.trim(),
          description: values.description.trim(),
          price: Number(values.price),
          stock: Number(values.stock),
        },
        newGalleryImages: galleryImages,
      });
      return;
    }

    const formData = new FormData();
    formData.append('name', values.name.trim());
    formData.append('description', values.description.trim());
    formData.append('price', String(values.price));
    formData.append('stock', String(values.stock));
    formData.append('categoryId', String(values.categoryId));
    formData.append('image', primaryImage);

    createMutation.mutate(formData);
  });

  return (
    <div className="space-y-12 pb-20">
      {isEdit && productLoading ? (
        <ProductFormLoading />
      ) : isEdit && productError ? (
        <StatePanel
          className="bg-white border-[var(--color-stone)]/10 p-12 shadow-xl rounded-[3rem]"
          message={(
            <div className="text-center">
              <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Unable to sync creation dossier.</p>
              <button onClick={() => refetchProduct()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry Synchronization</button>
            </div>
          )}
        />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Back Navigation */}
          <Link 
            to="/seller/inventory" 
            className="inline-flex items-center gap-3 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] hover:text-[var(--color-accent)] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-[var(--color-stone)]/10 flex items-center justify-center group-hover:bg-[var(--color-sand)]/20 transition-all">
              <ChevronLeft size={18} />
            </div>
            Back to Studio Inventory
          </Link>

          {/* Creation Hero */}
          <section className="relative overflow-hidden rounded-[4rem] bg-[var(--color-primary-dark)] p-12 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 rounded-[2.5rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                  {isEdit ? <Layers size={40} className="text-[var(--color-accent)]" /> : <PlusCircle size={40} className="text-[var(--color-accent)]" />}
                </div>
                <div>
                  <h1 className="text-5xl font-['Fraunces'] font-semibold leading-tight">{isEdit ? 'Refine Creation' : 'Studio Creation'}</h1>
                  <p className="mt-2 text-white/60 font-medium tracking-wide uppercase text-sm">Orchestrating a new piece for your collection</p>
                </div>
              </div>
              
              <div className="hidden lg:flex flex-col items-end opacity-20">
                <Sparkles size={120} />
              </div>
            </div>
          </section>

          <form onSubmit={onSubmit} className="grid gap-12 xl:grid-cols-[1fr,400px]">
            <div className="space-y-12">
              {/* Essential Canvas */}
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 shadow-xl rounded-[4rem]">
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-12 h-12 rounded-[1.2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                    <Zap size={24} />
                  </div>
                  <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Creation Details</h2>
                </div>

                <div className="grid gap-10 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FormField label="Exhibition Title" error={errors.name?.message}>
                      <input
                        {...register('name', { required: 'Registry title is required.' })}
                        placeholder="e.g. Hand-poured Botanical Candle"
                        className={inputClass(errors.name)}
                      />
                    </FormField>
                  </div>

                  <FormField label="Valuation (₹)" error={errors.price?.message}>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-stone)] group-focus-within:text-[var(--color-accent)] transition-colors font-bold">₹</div>
                      <input
                        type="number"
                        step="0.01"
                        {...register('price', { required: 'Valuation is required.', min: 1 })}
                        placeholder="0.00"
                        className={inputClass(errors.price, true)}
                      />
                    </div>
                  </FormField>

                  <FormField label="Studio Volume" error={errors.stock?.message}>
                    <input
                      type="number"
                      {...register('stock', { required: 'Units available are required.', min: 0 })}
                      placeholder="Units available"
                      className={inputClass(errors.stock)}
                    />
                  </FormField>

                  <div className="md:col-span-2">
                    <FormField label="The Narrative" error={errors.description?.message}>
                      <textarea
                        rows="8"
                        {...register('description', { required: 'The piece narrative is required.' })}
                        placeholder="Tell the story of your creation, the materials used, and your artisanal process..."
                        className={inputClass(errors.description)}
                      />
                    </FormField>
                  </div>

                  <FormField label="Collection Category" error={errors.categoryId?.message}>
                    <div className="relative">
                      <select
                        {...register('categoryId', { required: 'Category is required.' })}
                        disabled={categoriesLoading || isEdit}
                        className={`${inputClass(errors.categoryId)} appearance-none`}
                      >
                        <option value="">Select a Collection</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-stone)]">
                        <Tag size={18} />
                      </div>
                    </div>
                  </FormField>
                </div>

                <div className="mt-16 pt-12 border-t border-[var(--color-stone)]/5 flex items-center gap-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-16 rounded-[1.5rem] bg-[var(--color-primary-dark)] text-white font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Syncing Dossier...' : isEdit ? 'Finalize Refinement' : 'Confirm Creation'}
                  </button>
                  <Link
                    to="/seller/inventory"
                    className="px-10 h-16 flex items-center justify-center rounded-[1.5rem] border-2 border-[var(--color-stone)]/5 font-bold text-[var(--color-stone)] hover:bg-[var(--color-sand)]/20 transition-all"
                  >
                    Discard
                  </Link>
                </div>
              </SurfaceCard>
            </div>

            <div className="space-y-12">
              {/* Visual Studio */}
              <SurfaceCard className="bg-white border-[var(--color-stone)]/5 p-10 rounded-[3rem] shadow-xl">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                    <Camera size={18} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-primary-dark)]">Visual Studio</h3>
                </div>

                <div className="space-y-8">
                  {!isEdit && (
                    <ImagePicker
                      title="Primary Exhibit"
                      description="The hero visual for your piece."
                      onFilesSelected={(files) => setPrimaryImage(files[0])}
                    />
                  )}

                  <AnimatePresence>
                    {primaryPreview && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative aspect-square rounded-[2rem] overflow-hidden border-4 border-[var(--color-accent)]/20 shadow-2xl group"
                      >
                        <SafeImage src={primaryPreview} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setPrimaryImage(null)} 
                          className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/90 backdrop-blur shadow-md flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X size={20} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isEdit && existingImages.length > 0 && (
                     <div className="grid grid-cols-2 gap-4">
                       {existingImages.map((img, i) => (
                         <div key={img.id || i} className="aspect-square rounded-[1.5rem] overflow-hidden border border-[var(--color-stone)]/5 bg-[var(--color-sand)]/10 relative group">
                           <SafeImage src={img.url || img} className="w-full h-full object-cover" />
                           <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                             <button 
                               type="button"
                               onClick={() => setPrimaryImageMutation.mutate(img.id)}
                               title="Set as Primary"
                               className={`w-8 h-8 rounded-lg bg-white/90 shadow-sm flex items-center justify-center ${img.isPrimary ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'} transition-all`}
                             >
                               <Star size={14} className={img.isPrimary ? 'fill-amber-500' : ''} />
                             </button>
                             <button 
                               type="button"
                               onClick={() => {
                                 if (window.confirm('Remove this visual from your piece dossier?')) {
                                   deleteImageMutation.mutate(img.id);
                                 }
                               }}
                               className="w-8 h-8 rounded-lg bg-white/90 shadow-sm flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                             >
                               <Trash2 size={14} />
                             </button>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}

                  <div className="pt-4 border-t border-[var(--color-stone)]/5">
                    <ImagePicker
                      title="Gallery Additions"
                      description={isEdit ? "Enhance the visual dossier." : "Enabled after initial curation."}
                      acceptMultiple
                      onFilesSelected={setGalleryImages}
                      disabled={!isEdit}
                    />
                  </div>

                  {galleryPreviews.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      {galleryPreviews.map((p, i) => (
                        <div key={i} className="aspect-square rounded-[1.5rem] overflow-hidden border border-[var(--color-stone)]/5 bg-white relative group">
                          <SafeImage src={p.preview} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setGalleryImages(prev => prev.filter((_, idx) => idx !== i))} 
                            className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-white/90 shadow-sm flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SurfaceCard>

              {/* Studio Insights */}
              <SurfaceCard className="bg-[var(--color-primary-dark)] text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Info size={18} className="text-[var(--color-accent)]" />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Curation Insights</h3>
                  </div>
                  <ul className="space-y-4">
                    <InsightTip text="Aesthetic consistency leads to higher collector trust." />
                    <InsightTip text="Narratives with material origins resonate deeply." />
                    <InsightTip text="High-fidelity visuals are the studio standard." />
                  </ul>
                </div>
              </SurfaceCard>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-text-muted)] pl-2">{label}</label>
      {children}
      {error && (
        <motion.p 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs font-bold text-rose-500 mt-2 pl-2 flex items-center gap-2"
        >
          <XCircle size={12} /> {error}
        </motion.p>
      )}
    </div>
  );
}

function InsightTip({ text }) {
  return (
    <li className="flex gap-3 text-xs text-white/50 leading-relaxed italic">
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-1.5 shrink-0" />
      {text}
    </li>
  );
}

function ImagePicker({ title, description, onFilesSelected, disabled, acceptMultiple }) {
  return (
    <label className={`group block p-10 rounded-[2.5rem] border-2 border-dashed border-[var(--color-stone)]/10 bg-[var(--color-sand)]/5 text-center cursor-pointer transition-all hover:bg-white hover:border-[var(--color-accent)]/30 hover:shadow-xl ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <input type="file" className="hidden" disabled={disabled} multiple={acceptMultiple} onChange={e => onFilesSelected(Array.from(e.target.files))} />
      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-[var(--color-primary-dark)] mx-auto mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-transform">
        <Plus size={24} />
      </div>
      <p className="font-bold text-[var(--color-primary-dark)] text-lg mb-2">{title}</p>
      <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest leading-relaxed">{description}</p>
    </label>
  );
}



function inputClass(error, hasPrefix = false) {
  return `w-full rounded-[1.5rem] border-2 bg-[var(--color-sand)]/20 ${hasPrefix ? 'pl-10' : 'px-6'} py-5 text-[var(--color-primary-dark)] font-bold placeholder:text-[var(--color-stone)]/40 transition-all focus:bg-white focus:ring-4 focus:ring-[var(--color-accent)]/5 outline-none ${
    error ? 'border-rose-200 focus:border-rose-400' : 'border-transparent focus:border-[var(--color-accent)]/20'
  }`;
}

function ProductFormLoading() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="h-64 rounded-[4rem] bg-[var(--color-sand)]/20" />
      <div className="grid grid-cols-[1.2fr,400px] gap-12">
        <div className="h-[700px] rounded-[4rem] bg-[var(--color-sand)]/20" />
        <div className="h-[500px] rounded-[3rem] bg-[var(--color-sand)]/20" />
      </div>
    </div>
  );
}
