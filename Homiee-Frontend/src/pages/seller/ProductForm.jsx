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
  const [variants, setVariants] = useState([]);

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
    setVariants(product.variants ?? []);
  }, [isEdit, product, reset]);

  const createMutation = useMutation({
    mutationFn: (formData) => createSellerProduct(formData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['seller-inventory'] });
      toast.success(response?.message || 'Product added successfully.');
      navigate('/seller/inventory');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add product.');
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
      toast.success(response?.message || 'Product updated successfully.');
      navigate('/seller/inventory');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update product.');
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: deleteSellerProductImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-product', productId] });
      toast.success('Image removed.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove image.');
    }
  });

  const setPrimaryImageMutation = useMutation({
    mutationFn: setSellerProductPrimaryImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-product', productId] });
      toast.success('Main image updated.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update main image.');
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
      toast.error('Please select a main product image.');
      return;
    }

    if (isEdit) {
      updateMutation.mutate({
        payload: {
          name: values.name.trim(),
          description: values.description.trim(),
          price: Number(values.price),
          stock: Number(values.stock),
          variants: variants.map(v => ({
            id: v.id || 0,
            label: v.label.trim(),
            price: Number(v.price),
            stock: Number(v.stock),
            sku: v.sku?.trim()
          }))
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

    variants.forEach((v, index) => {
      formData.append(`variants[${index}].label`, v.label.trim());
      formData.append(`variants[${index}].price`, String(v.price));
      formData.append(`variants[${index}].stock`, String(v.stock));
      if (v.sku) formData.append(`variants[${index}].sku`, v.sku.trim());
    });

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
              <p className="text-xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-4">Failed to load product details.</p>
              <button onClick={() => refetchProduct()} className="px-8 py-4 bg-[var(--color-primary-dark)] text-white rounded-2xl font-bold">Retry</button>
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
            Back to Inventory
          </Link>

          {/* Product Header */}
          <section className="relative overflow-hidden rounded-[2rem] sm:rounded-[4rem] bg-[var(--color-primary-dark)] p-8 sm:p-12 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 rounded-[2.5rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                  {isEdit ? <Layers size={40} className="text-[var(--color-accent)]" /> : <PlusCircle size={40} className="text-[var(--color-accent)]" />}
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-['Fraunces'] font-semibold leading-tight">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
                  <p className="mt-2 text-white/60 font-medium tracking-wide uppercase text-sm">List a new product on the platform.</p>
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
                  <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Basic Information</h2>
                </div>

                <div className="grid gap-10 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FormField label="Product Name" error={errors.name?.message}>
                      <input
                        {...register('name', { required: 'Product name is required.' })}
                        placeholder="e.g. Hand-poured Botanical Candle"
                        className={inputClass(errors.name)}
                      />
                    </FormField>
                  </div>

                  <FormField label="Price (₹)" error={errors.price?.message}>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-stone)] group-focus-within:text-[var(--color-accent)] transition-colors font-bold">₹</div>
                      <input
                        type="number"
                        step="0.01"
                        {...register('price', { required: 'Price is required.', min: 1 })}
                        placeholder="0.00"
                        className={inputClass(errors.price, true)}
                      />
                    </div>
                  </FormField>

                  <FormField label="Stock Quantity" error={errors.stock?.message}>
                    <input
                      type="number"
                      {...register('stock', { required: 'Stock quantity is required.', min: 0 })}
                      placeholder="Units available"
                      className={inputClass(errors.stock)}
                    />
                  </FormField>

                  <div className="md:col-span-2">
                    <FormField label="Description" error={errors.description?.message}>
                      <textarea
                        rows="8"
                        {...register('description', { required: 'Product description is required.' })}
                        placeholder="Describe your product, materials used, and your process..."
                        className={inputClass(errors.description)}
                      />
                    </FormField>
                  </div>

                  <FormField label="Category" error={errors.categoryId?.message}>
                    <div className="relative">
                      <select
                        {...register('categoryId', { required: 'Please select a category.' })}
                        disabled={categoriesLoading || isEdit}
                        className={`${inputClass(errors.categoryId)} appearance-none`}
                      >
                        <option value="">Select a Category</option>
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

                {/* VARIANTS SECTION */}
                <div className="mt-16 pt-12 border-t border-[var(--color-stone)]/5 space-y-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[1.2rem] bg-[var(--color-sand)]/30 flex items-center justify-center text-[var(--color-primary-dark)]">
                        <Layers size={24} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)]">Product Options</h2>
                        <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mt-1 italic">Add different sizes, colors, or weights (Optional)</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVariants([...variants, { label: '', price: '', stock: '', sku: '' }])}
                      className="px-6 py-3 bg-[var(--color-accent)] text-[var(--color-primary-dark)] rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Plus size={16} /> Add Option
                    </button>
                  </div>

                  {variants.length > 0 ? (
                    <div className="grid gap-6">
                      {variants.map((v, index) => (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-8 bg-[var(--color-sand)]/5 rounded-[2.5rem] border border-[var(--color-stone)]/5 relative group"
                        >
                          <div className="grid gap-6 md:grid-cols-4">
                            <div className="md:col-span-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 block ml-2 italic">Label</label>
                              <input
                                value={v.label}
                                onChange={(e) => {
                                  const newVariants = [...variants];
                                  newVariants[index].label = e.target.value;
                                  setVariants(newVariants);
                                }}
                                placeholder="e.g. 1 KG"
                                className="w-full rounded-xl border-2 border-transparent bg-white px-4 py-3 text-sm font-bold text-[var(--color-primary-dark)] outline-none focus:border-[var(--color-accent)]/30 transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 block ml-2 italic">Price (₹)</label>
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) => {
                                  const newVariants = [...variants];
                                  newVariants[index].price = e.target.value;
                                  setVariants(newVariants);
                                }}
                                placeholder="0.00"
                                className="w-full rounded-xl border-2 border-transparent bg-white px-4 py-3 text-sm font-bold text-[var(--color-primary-dark)] outline-none focus:border-[var(--color-accent)]/30 transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 block ml-2 italic">Stock</label>
                              <input
                                type="number"
                                value={v.stock}
                                onChange={(e) => {
                                  const newVariants = [...variants];
                                  newVariants[index].stock = e.target.value;
                                  setVariants(newVariants);
                                }}
                                placeholder="0"
                                className="w-full rounded-xl border-2 border-transparent bg-white px-4 py-3 text-sm font-bold text-[var(--color-primary-dark)] outline-none focus:border-[var(--color-accent)]/30 transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 block ml-2 italic">SKU (Opt)</label>
                              <input
                                value={v.sku}
                                onChange={(e) => {
                                  const newVariants = [...variants];
                                  newVariants[index].sku = e.target.value;
                                  setVariants(newVariants);
                                }}
                                placeholder="SKU-CODE"
                                className="w-full rounded-xl border-2 border-transparent bg-white px-4 py-3 text-sm font-bold text-[var(--color-primary-dark)] outline-none focus:border-[var(--color-accent)]/30 transition-all"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border border-[var(--color-stone)]/10 flex items-center justify-center text-rose-500 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                          >
                            <X size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed border-[var(--color-stone)]/10 rounded-[3rem] text-center">
                      <p className="text-[var(--color-stone)] font-medium italic opacity-60">"No options added. This product will be listed as a single item."</p>
                    </div>
                  )}
                </div>

                <div className="mt-16 pt-12 border-t border-[var(--color-stone)]/5 flex items-center gap-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-16 rounded-[1.5rem] bg-[var(--color-primary-dark)] text-white font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
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
                  <h3 className="text-xl font-bold text-[var(--color-primary-dark)]">Product Images</h3>
                </div>

                <div className="space-y-8">
                  {!isEdit && (
                    <ImagePicker
                      title="Main Product Image"
                      description="This will be the main image shown to customers."
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
                               title="Set as Main Image"
                               className={`w-8 h-8 rounded-lg bg-white/90 shadow-sm flex items-center justify-center ${img.isPrimary ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'} transition-all`}
                             >
                               <Star size={14} className={img.isPrimary ? 'fill-amber-500' : ''} />
                             </button>
                             <button 
                               type="button"
                               onClick={() => {
                                 if (window.confirm('Are you sure you want to remove this image?')) {
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
                      title="Additional Images"
                      description={isEdit ? "Add more images of your product." : "Enabled after initial creation."}
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
                    <h3 className="text-sm font-bold uppercase tracking-widest">Selling Tips</h3>
                  </div>
                  <ul className="space-y-4">
                    <InsightTip text="High-quality photos help build customer trust." />
                    <InsightTip text="Detailed descriptions help customers make decisions." />
                    <InsightTip text="Use clear, bright images for better visibility." />
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
