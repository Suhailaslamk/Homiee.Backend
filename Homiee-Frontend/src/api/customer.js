import api from './axios';

export const getCart = async () => {
  const response = await api.get('/cart');
  return response.data;
};

export const addToCart = async (payload) => {
  const response = await api.post('/cart/add', payload);
  return response.data;
};

export const removeFromCart = async (productId) => {
  const response = await api.delete(`/cart/remove/${productId}`);
  return response.data;
};

export const getAddresses = async () => {
  const response = await api.get('/address');
  return response.data;
};

export const createAddress = async (payload) => {
  const response = await api.post('/address', payload);
  return response.data;
};

export const updateAddress = async (id, payload) => {
  const response = await api.put(`/address/${id}`, payload);
  return response.data;
};

export const deleteAddress = async (id) => {
  const response = await api.delete(`/address/${id}`);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get('/customer/orders');
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/customer/orders/${id}`);
  return response.data;
};

export const getOrderStatusHistory = async (id) => {
  const response = await api.get(`/customer/orders/${id}/status-history`);
  return response.data;
};

export const checkoutFromCart = async (payload) => {
  const response = await api.post('/customer/orders/from-cart', payload);
  return response.data;
};

export const cancelOrder = async (id) => {
  const response = await api.post(`/customer/orders/${id}/cancel`);
  return response.data;
};

export const initiateCartPayment = async (payload) => {
  const response = await api.post('/customer/orders/checkout/initiate-payment', payload);
  return response.data;
};
