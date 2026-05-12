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
    return <BusinessDetailsLoading />;
  }

  if (sellerError || !sellerResponse?.data) {
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center bg-[#fffaf2] px-6 text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[28px] flex items-center justify-center mb-6">
          <Info size={32} />
        </div>
        <h2 className="text-2xl font-black text-stone-800 mb-2">Vault Entry Failed</h2>
        <p className="text-stone-500 mb-8 max-w-sm">We couldn't retrieve this seller's identity from the blockchain.</p>
        <button onClick={() => navigate('/discovery')} className="bg-[#b85c38] text-white px-8 py-4 rounded-2xl font-black shadow-lg">Return to Marketplace</button>
      </div>
    );
  }

  const business = sellerResponse.data;
  const previewProducts = productsResponse?.data?.data?.data ?? [];

  return (
    <div className="pt-32 min-h-screen bg-[#f6efe6] pb-24">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Navigation */}
        <button 
          onClick={() => navigate(-1)}
          className="group flex items-center gap-3 text-stone-500 hover:text-stone-900 font-black uppercase tracking-widest text-[10px] mb-10 transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-[#b85c38] group-hover:text-white transition-colors">
            <ArrowLeft size={14} />
          </div>
          Return to Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-10">
          
          {/* LEFT COLUMN: BRAND CARD */}
          <div className="space-y-8">
            <div className="bg-[#fffaf2] rounded-[40px] p-10 border border-[#e8c9ba] shadow-2xl shadow-stone-200/40 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#b85c38]" />
              
              <div className="w-32 h-32 bg-[#b85c38] rounded-[38px] mx-auto mb-8 flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-[#b85c38]/20 border-4 border-white">
                {business.businessName?.[0] ?? 'S'}
              </div>
              
              <h1 className="text-3xl font-black text-stone-900 tracking-tight leading-tight mb-2">{business.businessName}</h1>
              <p className="text-[#b85c38] font-black uppercase tracking-[0.2em] text-[10px] mb-8">Verified Neighborhood Creator</p>
              
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#eef4ef] text-[#3f5143] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#d1e2d4]">
                <ShieldCheck size={14} /> Identity Verified
              </div>

              <div className="grid grid-cols-2 gap-4 mt-12 pt-10 border-t border-[#e8c9ba]/50">
                <div>
                  <div className="text-3xl font-black text-stone-900">{previewProducts.length}</div>
                  <div className="text-[9px] text-stone-400 uppercase font-black tracking-widest mt-1">Catalog Items</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#3f5143]">Active</div>
                  <div className="text-[9px] text-stone-400 uppercase font-black tracking-widest mt-1">Status</div>
                </div>
              </div>
            </div>

            <div className="bg-[#fffaf2] rounded-[34px] p-8 border border-[#e8c9ba] shadow-xl shadow-stone-200/20 space-y-6">
              <h3 className="font-black text-stone-900 uppercase tracking-widest text-[11px] flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#fff1eb] flex items-center justify-center text-[#b85c38]">
                  <Phone size={14} />
                </div>
                Communication
              </h3>
              <div className="space-y-4">
                <ContactInfo icon={<Mail size={16} />} label="In-App Messaging" value="Enabled via SignalR" />
                <ContactInfo icon={<Phone size={16} />} label="Phone Support" value={business.phoneNumber || 'Not listed'} />
                <ContactInfo icon={<MapPin size={16} />} label="Origin Base" value={business.address || 'Address unavailable'} />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: BUSINESS BIO & CREDENTIALS */}
          <div className="space-y-10">
            <div className="bg-[#fffaf2] rounded-[48px] p-12 border border-[#e8c9ba] shadow-2xl shadow-stone-200/40">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-[#eef4ef] flex items-center justify-center text-[#3f5143]">
                  <Briefcase size={24} />
                </div>
                <h2 className="text-3xl font-black text-stone-900 tracking-tight">Business Profile</h2>
              </div>
              
              <p className="text-stone-500 leading-relaxed mb-12 text-2xl font-medium italic">
                "{business.description || "Explore this seller's curated storefront to browse unique handcrafted pieces and local discoveries listed on Homiee."}"
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoFeature 
                  icon={<Calendar size={24} />} 
                  label="Registry ID" 
                  value={`#${business.id?.toString().slice(0, 8).toUpperCase()}`} 
                />
                <InfoFeature 
                  icon={<Award size={24} />} 
                  label="Storefront Access" 
                  value="Open Public Catalog"
                  link={`/store/${business.id}`}
                  linkText="View Products"
                />
              </div>
            </div>

            {/* Verification Documents Section */}
            <div className="bg-white rounded-[40px] p-10 border border-[#e8c9ba] shadow-xl shadow-stone-200/10">
              <h2 className="text-xl font-black text-stone-900 mb-8 uppercase tracking-widest text-[12px] opacity-40">Governance & Trust</h2>
              <div className="p-8 border-2 border-[#eef4ef] bg-[#eef4ef]/30 rounded-[30px] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white text-[#3f5143] rounded-[22px] flex items-center justify-center shadow-sm border border-[#d1e2d4]">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h4 className="font-black text-stone-900 text-xl tracking-tight">Enterprise Verified</h4>
                    <p className="text-stone-500 text-sm mt-1 font-medium">This boutique's tax and identity credentials have been audited by Homiee Governance.</p>
                  </div>
                </div>
                <Link to={`/store/${business.id}`} className="w-full sm:w-auto px-8 py-4 bg-[#3f5143] text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-[#2c392f] transition-all active:scale-95">
                  Visit Boutique <ExternalLink size={18} />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ContactInfo({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white transition-colors">
      <div className="text-stone-400 mt-0.5">{icon}</div>
      <div>
        <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-0.5">{label}</div>
        <div className="text-sm font-bold text-stone-700">{value}</div>
      </div>
    </div>
  );
}

function InfoFeature({ icon, label, value, link, linkText }) {
  return (
    <div className="p-8 bg-[#fff7ee] border border-[#e8c9ba]/50 rounded-[32px] flex flex-col gap-5">
      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#b85c38] border border-[#e8c9ba]/30">
        {icon}
      </div>
      <div>
        <div className="text-[10px] text-stone-400 font-black uppercase tracking-[0.2em] mb-2">{label}</div>
        <div className="font-black text-xl text-stone-900">{value}</div>
        {link && (
          <Link to={link} className="mt-4 inline-flex items-center gap-2 text-[#b85c38] font-black text-sm hover:translate-x-1 transition-transform">
            {linkText} <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}

function BusinessDetailsLoading() {
  return (
    <div className="pt-32 min-h-screen bg-[#f6efe6] pb-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-8 w-48 animate-pulse bg-white/50 rounded-xl mb-10" />
        <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-10">
          <div className="space-y-8">
            <div className="h-96 animate-pulse bg-white/50 rounded-[40px] border border-[#e8c9ba]" />
            <div className="h-64 animate-pulse bg-white/50 rounded-[34px] border border-[#e8c9ba]" />
          </div>
          <div className="space-y-10">
            <div className="h-[400px] animate-pulse bg-white/50 rounded-[48px] border border-[#e8c9ba]" />
            <div className="h-48 animate-pulse bg-white/50 rounded-[40px] border border-[#e8c9ba]" />
          </div>
        </div>
      </div>
    </div>
  );
}
