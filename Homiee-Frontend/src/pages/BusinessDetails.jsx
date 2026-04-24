import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldCheck, MapPin, Calendar, Mail, Phone, 
  ExternalLink, Info, Award, Briefcase, ArrowLeft 
} from 'lucide-react';
import { getSellerById, getSellerProducts } from '../api/marketplace';

export default function BusinessDetails() {
  const { businessId } = useParams();
  const navigate = useNavigate();

  const { data: sellerResponse, isLoading: sellerLoading, error: sellerError } = useQuery({
    queryKey: ['seller', businessId],
    queryFn: () => getSellerById(businessId),
    enabled: Boolean(businessId),
  });

  const { data: productsResponse } = useQuery({
    queryKey: ['seller-products-preview', businessId],
    queryFn: () => getSellerProducts(businessId, { page: 1, pageSize: 4 }),
    enabled: Boolean(businessId),
  });

  if (sellerLoading) {
    return <div className="pt-24 min-h-screen flex items-center justify-center bg-slate-50">Loading business details...</div>;
  }

  if (sellerError || !sellerResponse?.data) {
    return <div className="pt-24 min-h-screen flex items-center justify-center bg-slate-50">Unable to load business details.</div>;
  }

  const business = sellerResponse.data;
  const previewProducts = productsResponse?.data?.data?.data ?? [];

  return (
    <div className="pt-24 min-h-screen bg-slate-50 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Navigation */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold mb-6 transition"
        >
          <ArrowLeft size={18} /> Back to Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: BRAND CARD */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-blue-200">
                {business.businessName?.[0] ?? 'S'}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{business.businessName}</h1>
              <p className="text-slate-500 text-sm mb-4">Seller profile</p>
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={14} /> Listed on Homiee
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100">
                <div>
                  <div className="text-xl font-black text-slate-900">{previewProducts.length}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Preview Items</div>
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900">Verified</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Status</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Info size={18} className="text-blue-600" /> Contact Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail size={16} className="text-slate-400" /> Contact details are private
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone size={16} className="text-slate-400" /> {business.phoneNumber || 'Not provided'}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin size={16} className="text-slate-400" /> {business.address || 'Address unavailable'}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: BUSINESS BIO & CREDENTIALS */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Briefcase className="text-blue-600" /> About the Business
              </h2>
              <p className="text-slate-600 leading-relaxed mb-8 text-lg italic">
                "Explore this seller's storefront to browse the latest listed products and discover what they are offering on Homiee."
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm"><Calendar className="text-blue-600" /></div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase">Seller Id</div>
                    <div className="font-bold text-slate-900">#{business.id}</div>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm"><Award className="text-blue-600" /></div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase">Storefront</div>
                    <Link to={`/store/${business.id}`} className="font-bold text-slate-900 hover:text-blue-600">
                      View products
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Documents Section */}
            <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Transparency & Trust</h2>
              <div className="p-6 border-2 border-emerald-100 bg-emerald-50/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Identity Verified</h4>
                    <p className="text-slate-500 text-sm">Seller details are being served from the backend marketplace API.</p>
                  </div>
                </div>
                <Link to={`/store/${business.id}`} className="p-2 hover:bg-emerald-100 rounded-lg transition">
                  <ExternalLink size={20} className="text-emerald-600" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
