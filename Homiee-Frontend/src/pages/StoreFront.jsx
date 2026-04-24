import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { getSellerById, getSellerProducts } from '../api/marketplace';
import SafeImage from '../components/SafeImage';

export default function StoreFront() {
  const { sellerId } = useParams();
  const navigate = useNavigate();

  const { data: sellerResponse, isLoading: sellerLoading, error: sellerError } = useQuery({
    queryKey: ['store-seller', sellerId],
    queryFn: () => getSellerById(sellerId),
    enabled: Boolean(sellerId),
  });

  const { data: productsResponse, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['store-products', sellerId],
    queryFn: () => getSellerProducts(sellerId, { page: 1, pageSize: 20 }),
    enabled: Boolean(sellerId),
  });

  if (sellerLoading || productsLoading) {
    return <div className="pt-24 min-h-screen flex items-center justify-center bg-white">Loading storefront...</div>;
  }

  if (sellerError || productsError || !sellerResponse?.data) {
    return <div className="pt-24 min-h-screen flex items-center justify-center bg-white">Unable to load storefront.</div>;
  }

  const seller = sellerResponse.data;
  const products = productsResponse?.data?.data?.data ?? [];

  return (
    <div className="pt-16 min-h-screen bg-white">
      <div className="relative h-64 bg-gradient-to-r from-[#b85c38] via-[#cf7d5c] to-[#3f5143]">
        <div className="absolute -bottom-12 left-12 w-32 h-32 bg-white rounded-3xl shadow-lg border-4 border-white flex items-center justify-center text-3xl font-bold">
          {seller.businessName?.[0] ?? 'S'}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-12 pt-16 pb-10 border-b">
        <h1 className="text-4xl font-black text-slate-900">Official Store: {seller.businessName}</h1>
        <p className="text-slate-500 mt-2 max-w-2xl">{seller.address || 'Browse all products available from this business.'}</p>
      </div>

      <div className="max-w-7xl mx-auto px-12 py-10">
        <h2 className="text-2xl font-bold mb-8">All Products</h2>
        {products.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-slate-500">
            No products found for this seller yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="aspect-square bg-slate-100 overflow-hidden">
                  <SafeImage
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-black text-slate-900">${product.price.toFixed(2)}</span>
                    <span className="text-[#b85c38] font-bold flex items-center gap-1 text-sm">
                      View <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
