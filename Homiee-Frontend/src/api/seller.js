import api from './axios';

export const getSellerDashboard = async () => {
  const response = await api.get('/dashboard/seller');
  return response.data;
};

export const getSellerInventory = async (query = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page);
  if (query.pageSize) params.append('pageSize', query.pageSize);
  if (query.search) params.append('search', query.search);
  if (query.categoryId) params.append('categoryId', query.categoryId);
  if (query.minPrice) params.append('minPrice', query.minPrice);
  if (query.maxPrice) params.append('maxPrice', query.maxPrice);

  const response = await api.get(`/seller/products?${params}`);
  return response.data;
};

export const getSellerProduct = async (id) => {
  const response = await api.get(`/seller/products/product/${id}`);
  return response.data;
};

export const createSellerProduct = async (formData) => {
  const response = await api.post('/seller/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateSellerProduct = async (id, payload) => {
  const response = await api.put(`/seller/products/${id}`, payload);
  return response.data;
};

export const deleteSellerProduct = async (id) => {
  const response = await api.delete(`/seller/products/${id}`);
  return response.data;
};

export const updateSellerProductStock = async (id, stock) => {
  const response = await api.patch(`/seller/products/${id}/stock`, { stock });
  return response.data;
};

export const getSellerCategories = async () => {
  const response = await api.get('/seller/products/categories');
  return response.data;
};

export const getSellerOrders = async (query = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page);
  if (query.pageSize) params.append('pageSize', query.pageSize);
  if (query.status) params.append('status', query.status);

  const response = await api.get(`/seller/orders?${params}`);
  return response.data;
};

export const getSellerOrderById = async (id) => {
  const response = await api.get(`/seller/orders/order/${id}`);
  return response.data;
};

export const updateSellerOrderStatus = async (id, status) => {
  const response = await api.patch(`/seller/orders/${id}/status`, { status });
  return response.data;
};
