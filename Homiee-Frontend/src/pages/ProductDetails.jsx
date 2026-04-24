import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Heart, Truck, RotateCcw, ChevronRight } from 'lucide-react';
import { getProductById } from '../api/marketplace';
import SafeImage from '../components/SafeImage';
import { addToCart } from '../api/customer';
import { useToast } from '../hooks/useToast';

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const cartMutation = useMutation({
    mutationFn: addToCart,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success(response.message || 'Added to cart.');
    },
    onError: (mutationError) => {
      toast.error(mutationError.response?.data?.message || 'Unable to add item to cart.');
    },
  });

  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProductById(productId),
  });

  if (isLoading) return <div className="pt-24 min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="pt-24 min-h-screen flex items-center justify-center">Error loading product</div>;

  const product = productData?.data;

  return (
    <div className="pt-24 min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* BREADCRUMBS */}
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link to="/" className="hover:text-slate-900">Home</Link>
          <ChevronRight size={14} />
          <Link to="/discovery" className="hover:text-slate-900">Products</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* LEFT: IMAGE GALLERY */}
          <div className="space-y-4">
            <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-slate-100">
              <SafeImage 
                src={product?.images?.[0]} 
                alt={product?.name} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            {/* Small Thumbnails could go here */}
          </div>

          {/* RIGHT: PRODUCT INFO */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-slate-900 mb-2">{product?.name}</h1>
            
            <div className="text-3xl font-black text-slate-900 mb-8">
              ${product?.price?.toFixed(2)}
            </div>

            <p className="text-slate-600 leading-relaxed mb-8">
              {product?.description}
            </p>

            <div className="text-slate-500 mb-4">
              Stock: {product?.stock}
            </div>

            {/* QUANTITY & ACTIONS */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 hover:bg-slate-200 transition"
                >-</button>
                <span className="px-4 font-bold text-slate-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 hover:bg-slate-200 transition"
                >+</button>
              </div>
              <button
                onClick={() => cartMutation.mutate({ productId: Number(productId), quantity })}
                className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition shadow-xl flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <ShoppingCart size={20} />
                <span>
                  {cartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                </span>
              </button>
              <button onClick={() => navigate('/cart')} className="p-4 border border-slate-200 rounded-2xl hover:bg-red-50 hover:text-red-500 transition">
                <Heart size={20} />
              </button>
            </div>

            {/* LOGISTICS INFO */}
            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <Truck className="text-slate-400" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Free Delivery</h4>
                  <p className="text-xs text-slate-500">Orders over $100</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw className="text-slate-400" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">30 Day Returns</h4>
                  <p className="text-xs text-slate-500">Easy exchange policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
