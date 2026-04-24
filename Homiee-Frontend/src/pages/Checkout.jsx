import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, MapPin, Plus } from 'lucide-react';
import { checkoutFromCart, createAddress, getAddresses, getCart } from '../api/customer';
import { getProductById } from '../api/marketplace';
import { useToast } from '../hooks/useToast';
import { getResponseData } from '../utils/api';

const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  line1: '',
  city: '',
  state: '',
  pincode: '',
};

export default function Checkout() {
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressDraft, setAddressDraft] = useState(EMPTY_ADDRESS);

  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: cartResponse } = useQuery({ queryKey: ['cart'], queryFn: getCart });
  const { data: addressesResponse, isLoading } = useQuery({ queryKey: ['addresses'], queryFn: getAddresses });

  const cartItems = getResponseData(cartResponse) ?? [];
  const addresses = getResponseData(addressesResponse) ?? [];

  const productQueries = useQueries({
    queries: cartItems.map((item) => ({
      queryKey: ['checkout-product', item.productId],
      queryFn: () => getProductById(item.productId),
      enabled: Boolean(item.productId),
    })),
  });

  const subtotal = cartItems.reduce((sum, item, index) => {
    const product = productQueries[index]?.data?.data;
    return sum + ((product?.price ?? 0) * item.quantity);
  }, 0);

  const createAddressMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setAddressDraft(EMPTY_ADDRESS);
      setShowAddressForm(false);
      toast.success('Address saved successfully.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to save address.');
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: checkoutFromCart,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(response.message || 'Order placed successfully.');
      navigate('/success');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Unable to place order.');
    },
  });

  if (isLoading) {
    return <SimpleState message="Loading checkout..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Checkout</h1>
            <p className="mt-2 text-slate-500">Choose a delivery address and confirm the cart order.</p>
          </div>
          <button onClick={() => navigate('/cart')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
            <ArrowLeft size={16} /> Back to cart
          </button>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Delivery Address</h2>
                  <p className="mt-1 text-sm text-slate-500">Select one of your saved addresses or add a new one.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressForm((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                >
                  <Plus size={16} /> {showAddressForm ? 'Close form' : 'Add address'}
                </button>
              </div>

              {showAddressForm && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    createAddressMutation.mutate(addressDraft);
                  }}
                  className="mb-6 grid gap-4 rounded-[24px] bg-slate-50 p-5 md:grid-cols-2"
                >
                  <InputField label="Full Name" value={addressDraft.fullName} onChange={(value) => setAddressDraft((current) => ({ ...current, fullName: value }))} />
                  <InputField label="Phone" value={addressDraft.phone} onChange={(value) => setAddressDraft((current) => ({ ...current, phone: value }))} />
                  <div className="md:col-span-2">
                    <InputField label="Address Line" value={addressDraft.line1} onChange={(value) => setAddressDraft((current) => ({ ...current, line1: value }))} />
                  </div>
                  <InputField label="City" value={addressDraft.city} onChange={(value) => setAddressDraft((current) => ({ ...current, city: value }))} />
                  <InputField label="State" value={addressDraft.state} onChange={(value) => setAddressDraft((current) => ({ ...current, state: value }))} />
                  <InputField label="Pincode" value={addressDraft.pincode} onChange={(value) => setAddressDraft((current) => ({ ...current, pincode: value }))} />
                  <div className="md:col-span-2">
                    <button type="submit" className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white">
                      Save address
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {addresses.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No saved addresses yet. Add one to continue.</p>
                ) : (
                  addresses.map((address) => (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`w-full rounded-[24px] border p-5 text-left transition ${
                        selectedAddressId === address.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-bold text-slate-900">{address.fullName}</div>
                          <div className="mt-1 text-sm text-slate-500">{address.phone}</div>
                          <div className="mt-3 text-sm text-slate-600">
                            {address.line1}, {address.city}, {address.state} {address.pincode}
                          </div>
                        </div>
                        {selectedAddressId === address.id && <CheckCircle2 className="text-blue-600" size={20} />}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside>
            <div className="sticky top-28 rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">Cart Summary</h2>
              <div className="mt-6 space-y-3">
                {cartItems.map((item, index) => {
                  const product = productQueries[index]?.data?.data;
                  return (
                    <div key={item.productId} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-slate-900">{product?.name || `Product #${item.productId}`}</div>
                        <div className="text-xs text-slate-500">Qty {item.quantity}</div>
                      </div>
                      <div className="font-bold text-slate-900">${((product?.price ?? 0) * item.quantity).toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 border-t border-slate-100 pt-6">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Items total</span>
                  <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  disabled={!selectedAddressId || checkoutMutation.isPending || cartItems.length === 0}
                  onClick={() => checkoutMutation.mutate({ addressId: selectedAddressId })}
                  className="mt-6 w-full rounded-2xl bg-slate-900 py-4 font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checkoutMutation.isPending ? 'Placing order...' : 'Place order from cart'}
                </button>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={16} className="text-blue-600" />
                  Address-based cart checkout uses `api/customer/orders/from-cart`.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-blue-600"
      />
    </label>
  );
}

function SimpleState({ message }) {
  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">{message}</div>
      </div>
    </div>
  );
}
