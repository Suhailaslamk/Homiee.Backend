import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Boxes, ChevronLeft, Image as ImageIcon, ShoppingBag, Users } from 'lucide-react';
import WorkspaceShell from '../../components/WorkspaceShell';
import SafeImage from '../../components/SafeImage';
import StatePanel from '../../components/StatePanel';
import StatusPill from '../../components/StatusPill';
import SurfaceCard from '../../components/SurfaceCard';
import { getAdminProductById } from '../../api/admin';
import { getResponseData } from '../../utils/api';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: Boxes },
  { label: 'Sellers', path: '/admin/sellers', icon: Users },
  { label: 'Customers', path: '/admin/customers', icon: Users },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Products', path: '/admin/products', icon: Boxes },
  { label: 'Categories', path: '/admin/categories', icon: Boxes },
];

export default function ProductDetails() {
  const { productId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: () => getAdminProductById(productId),
    enabled: Boolean(productId),
  });

  const product = getResponseData(data);

  return (
    <WorkspaceShell title="Admin Console" subtitle="Product detail review and image gallery." navItems={NAV_ITEMS} accent="slate">
      {isLoading || !product ? (
        <StatePanel message="Loading product details..." />
      ) : (
        <div className="space-y-8">
          <div>
            <Link to="/admin/products" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
              <ChevronLeft size={16} /> Back to products
            </Link>
            <h1 className="mt-4 text-3xl font-black text-slate-900">{product.name}</h1>
            <p className="mt-2 text-slate-500">Detail screen for `api/admin/products/{productId}` to inspect inventory records and media.</p>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <SurfaceCard>
              <div className="grid gap-4 md:grid-cols-2">
                {(product.images ?? []).length === 0 ? (
                  <div className="col-span-full rounded-[24px] bg-slate-50 p-10 text-center text-slate-500">
                    <ImageIcon size={28} className="mx-auto mb-3 text-slate-300" />
                    No product images returned by the backend.
                  </div>
                ) : (
                  product.images.map((image, index) => (
                    <div key={`${image}-${index}`} className="aspect-square overflow-hidden rounded-[24px] bg-slate-100">
                      <SafeImage src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))
                )}
              </div>
            </SurfaceCard>

            <div className="space-y-8">
              <SurfaceCard>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Seller</div>
                    <div className="mt-2 text-xl font-black text-slate-900">{product.sellerName}</div>
                  </div>
                  <StatusPill value={product.status} />
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Metric label="Price" value={`$${Number(product.price).toFixed(2)}`} />
                  <Metric label="Stock" value={product.stock} />
                </div>
              </SurfaceCard>

              <SurfaceCard>
                <h2 className="text-xl font-black text-slate-900">Description</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{product.description || 'No description returned.'}</p>
                {product.rejectionReason && (
                  <div className="mt-6 rounded-[24px] bg-rose-50 p-5 text-sm text-rose-700">
                    Rejection reason: {product.rejectionReason}
                  </div>
                )}
              </SurfaceCard>
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-[24px] bg-slate-50 p-5">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}
