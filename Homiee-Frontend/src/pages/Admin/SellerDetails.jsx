import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Boxes, ChevronLeft, FileCheck2, MapPin, Phone, ShoppingBag, Users } from 'lucide-react';
import WorkspaceShell from '../../components/WorkspaceShell';
import StatePanel from '../../components/StatePanel';
import StatusPill from '../../components/StatusPill';
import SurfaceCard from '../../components/SurfaceCard';
import { getAdminSellerById } from '../../api/admin';
import { getResponseData } from '../../utils/api';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: Boxes },
  { label: 'Sellers', path: '/admin/sellers', icon: Users },
  { label: 'Customers', path: '/admin/customers', icon: Users },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Products', path: '/admin/products', icon: Boxes },
  { label: 'Categories', path: '/admin/categories', icon: Boxes },
];

export default function SellerDetails() {
  const { userId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-seller', userId],
    queryFn: () => getAdminSellerById(userId),
    enabled: Boolean(userId),
  });

  const seller = getResponseData(data);

  return (
    <WorkspaceShell title="Admin Console" subtitle="Seller application details and document links." navItems={NAV_ITEMS} accent="slate">
      {isLoading || !seller ? (
        <StatePanel message="Loading seller details..." />
      ) : (
        <div className="space-y-8">
          <div>
            <Link to="/admin/sellers" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
              <ChevronLeft size={16} /> Back to sellers
            </Link>
            <h1 className="mt-4 text-3xl font-black text-slate-900">{seller.businessName}</h1>
            <p className="mt-2 text-slate-500">Detail screen for `api/admin/sellers/{userId}` so admins can inspect seller onboarding data.</p>
          </div>

          <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
            <SurfaceCard>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Approval Status</div>
                    <div className="mt-3"><StatusPill value={seller.status} /></div>
                  </div>
                  <div className="rounded-3xl bg-slate-900 px-4 py-3 text-white">Seller</div>
                </div>
                <DetailRow icon={<Phone size={18} />} label="Phone Number" value={seller.phoneNumber || 'Not provided'} />
                <DetailRow icon={<MapPin size={18} />} label="Address" value={seller.address || 'Not provided'} />
                <DetailRow icon={<FileCheck2 size={18} />} label="GST Number" value={seller.gstNumber || 'Not provided'} />
              </div>
            </SurfaceCard>

            <div className="space-y-8">
              <SurfaceCard>
                <h2 className="text-xl font-black text-slate-900">Verification Documents</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <DocumentLink label="Business Proof" href={seller.businessProofUrl} />
                  <DocumentLink label="Identity Proof" href={seller.identityProofUrl} />
                </div>
              </SurfaceCard>

              <SurfaceCard>
                <h2 className="text-xl font-black text-slate-900">Moderation Notes</h2>
                <div className="mt-5 rounded-[24px] bg-slate-50 p-5">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Rejection Reason</div>
                  <p className="mt-3 text-sm text-slate-700">{seller.rejectionReason || 'No rejection reason recorded.'}</p>
                </div>
              </SurfaceCard>
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-3 text-slate-500">
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-3 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function DocumentLink({ label, href }) {
  return (
    <a
      href={href || '#'}
      target="_blank"
      rel="noreferrer"
      className={`rounded-[24px] border p-5 transition ${href ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50' : 'border-slate-100 bg-slate-50 text-slate-400 pointer-events-none'}`}
    >
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-3 font-bold text-slate-900">{href ? 'Open document' : 'Not available'}</div>
    </a>
  );
}
