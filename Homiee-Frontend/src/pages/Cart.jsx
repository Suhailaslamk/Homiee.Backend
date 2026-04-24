import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Package2, ShoppingBag, Trash2 } from 'lucide-react';
import { getCart, removeFromCart } from '../api/customer';
import { getProductById } from '../api/marketplace';
import SafeImage from '../components/SafeImage';
import { useToast } from '../hooks/useToast';
import { getResponseData } from '../utils/api';

export default function Cart() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
  });

  const cartItems = getResponseData(data) ?? [];

  const productQueries = useQueries({
    queries: cartItems.map((item) => ({
      queryKey: ['cart-product', item.productId],
      queryFn: () => getProductById(item.productId),
      enabled: Boolean(item.productId),
    })),
  });

  const enrichedItems = cartItems.map((item, index) => {
    const product = productQueries[index]?.data?.data;
    return {
      ...item,
      product,
    };
  });

  const removeMutation = useMutation({
    mutationFn: removeFromCart,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success(response.message || 'Item removed from cart.');
    },
    onError: (mutationError) => {
      toast.error(mutationError.response?.data?.message || 'Unable to remove item.');
    },
  });

  const subtotal = enrichedItems.reduce((sum, item) => sum + ((item.product?.price ?? 0) * item.quantity), 0);

  if (isLoading) {
    return <PageState message="Loading your cart..." />;
  }

  if (error) {
    return <PageState message="Unable to load cart right now." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Shopping Cart</h1>
            <p className="mt-2 text-slate-500">Review the items you have saved before placing your order.</p>
          </div>
          <Link to="/discovery" className="text-sm font-bold text-blue-600 hover:text-blue-700">
            Continue shopping
          </Link>
        </div>

        {enrichedItems.length === 0 ? (
          <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Package2 className="mx-auto mb-4 text-slate-300" size={40} />
            <h2 className="text-xl font-bold text-slate-900">Your cart is empty</h2>
            <p className="mt-2 text-slate-500">Browse the marketplace and add products to see them here.</p>
            <Link
              to="/discovery"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-blue-600"
            >
              Explore products <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.6fr_0.9fr]">
            <div className="space-y-4">
              {enrichedItems.map((item) => (
                <div key={item.productId} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      <SafeImage
                        src={item.product?.images?.[0]}
                        alt={item.product?.name || `Product ${item.productId}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">{item.product?.name || `Product #${item.productId}`}</h2>
                          <p className="mt-1 text-sm text-slate-500">Seller #{item.sellerId}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate(item.productId)}
                          className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">
                          Quantity: {item.quantity}
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Unit Price</div>
                          <div className="text-xl font-black text-slate-900">${(item.product?.price ?? 0).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="sticky top-28 rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-black text-slate-900">Order Summary</h2>
                <div className="mt-6 space-y-4">
                  <SummaryRow label="Items" value={String(enrichedItems.length)} />
                  <SummaryRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                  <SummaryRow label="Shipping" value="Calculated at checkout" />
                </div>
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="flex items-end justify-between">
                    <span className="font-bold text-slate-900">Estimated total</span>
                    <span className="text-3xl font-black text-blue-600">${subtotal.toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/checkout')}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 font-bold text-white transition hover:bg-blue-600"
                  >
                    Proceed to checkout <ArrowRight size={18} />
                  </button>
                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    <ShoppingBag size={16} className="text-blue-600" />
                    Cart details are pulled from your authenticated `api/cart` session.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

function PageState({ message }) {
  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-sm text-slate-500">
          {message}
        </div>
      </div>
    </div>
  );
}
