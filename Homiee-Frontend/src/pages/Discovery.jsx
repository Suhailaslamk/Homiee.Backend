import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, Store, Star, ArrowRight, ShieldCheck } from 'lucide-react';
import { getProducts, getSellers } from '../api/marketplace';
import SafeImage from '../components/SafeImage';

export default function Discovery() {
  const [viewType, setViewType] = useState('products'); // 'products' or 'sellers'
  const navigate = useNavigate();

  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts({ page: 1, pageSize: 20 }),
    enabled: viewType === 'products',
  });

  const { data: sellersData, isLoading: sellersLoading, error: sellersError } = useQuery({
    queryKey: ['sellers'],
    queryFn: () => getSellers({ page: 1, pageSize: 20 }),
    enabled: viewType === 'sellers',
  });

  const products = productsData?.data?.data ?? [];
  const sellers = sellersData?.data?.data ?? [];

  return (
    <div className="pt-24 min-h-screen bg-slate-50 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER & TOGGLE */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Explore Marketplace</h1>
            <p className="text-slate-500">Find the best products or discover top-rated businesses.</p>
          </div>

          <div className="flex bg-slate-200 p-1 rounded-xl">
            <button 
              onClick={() => setViewType('products')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition ${viewType === 'products' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
            >
              <LayoutGrid size={18} /> Products
            </button>
            <button 
              onClick={() => setViewType('sellers')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition ${viewType === 'sellers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
            >
              <Store size={18} /> Businesses
            </button>
          </div>
        </div>

        {/* DYNAMIC CONTENT AREA */}
        {viewType === 'products' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productsLoading ? (
              <div className="col-span-full text-center py-10">Loading products...</div>
            ) : productsError ? (
              <div className="col-span-full text-center py-10 text-red-500">Error loading products</div>
            ) : products.length === 0 ? (
              <div className="col-span-full text-center py-10 text-slate-500">No products found</div>
            ) : (
              products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onClick={() => navigate(`/product/${product.id}`)} 
                />
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sellersLoading ? (
              <div className="col-span-full text-center py-10">Loading sellers...</div>
            ) : sellersError ? (
              <div className="col-span-full text-center py-10 text-red-500">Error loading sellers</div>
            ) : sellers.length === 0 ? (
              <div className="col-span-full text-center py-10 text-slate-500">No sellers found</div>
            ) : (
              sellers.map(seller => (
                <SellerCard 
                  key={seller.id} 
                  seller={seller} 
                  onClick={() => navigate(`/business/${seller.id}`)} 
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const SellerCard = ({ seller, onClick }) => (
  <div onClick={onClick} className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-xl transition-all cursor-pointer group">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center font-bold text-blue-600 text-xl">
        {seller.businessName[0]}
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition">{seller.businessName}</h3>
        <div className="flex items-center text-amber-500 text-sm">
          <Star size={14} fill="currentColor" /> Verified Seller
        </div>
      </div>
    </div>
    <p className="text-slate-500 text-sm mb-6 line-clamp-2">{seller.address}</p>
    <div className="flex justify-between items-center border-t pt-4">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{seller.productCount} Products</span>
      <div className="text-blue-600 font-bold flex items-center gap-1 text-sm">
        Visit Shop <ArrowRight size={16} />
      </div>
    </div>
  </div>
);

const ProductCard = ({ product, onClick }) => (
  <div onClick={onClick} className="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer group">
    <div className="aspect-square bg-slate-100 overflow-hidden">
      <SafeImage src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
    </div>
    <div className="p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
          <ShieldCheck size={12} /> {product.sellerName}
        </span>
      </div>
      <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
      <p className="mt-2 text-sm text-slate-500">By {product.sellerName}</p>
      <div className="mt-5 flex items-center justify-between">
        <span className="text-lg font-black text-slate-900">${product.price.toFixed(2)}</span>
      </div>
    </div>
  </div>
);
