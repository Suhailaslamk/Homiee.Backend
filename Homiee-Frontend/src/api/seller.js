import api from './axios';
// Seller Portfolio API - V2.1

export const getSellerDashboard = async () => {
  const response = await api.get('/seller/analytics/kpis');
  return response.data;
};

export const getSellerAnalytics = async (query = {}) => {
  const params = new URLSearchParams();
  if (query.days) params.append('days', query.days);
  if (query.topN) params.append('topN', query.topN);

  const response = await api.get(`/seller/analytics?${params}`);
  return response.data;
};

export const getSellerEarnings = async (query = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page);
  if (query.pageSize) params.append('pageSize', query.pageSize);

  const response = await api.get(`/seller/earnings?${params}`);
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
  if (query.sortBy) params.append('sortBy', query.sortBy);
  if (typeof query.desc === 'boolean') params.append('desc', query.desc);
  if (typeof query.inStockOnly === 'boolean') params.append('inStockOnly', query.inStockOnly);

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

export const addSellerProductImages = async (id, files) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await api.post(`/seller/products/${id}/images`, formData, {
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

export const getSellerOrderTracking = async (id) => {
  const response = await api.get(`/seller/orders/${id}/tracking`);
  return response.data;
};

export const updateSellerOrderStatus = async (id, status) => {
  const response = await api.patch(`/seller/orders/${id}/status`, { status });
  return response.data;
};

export const deleteSellerProductImage = async (imageId) => {
  const response = await api.delete(`/seller/products/images/${imageId}`);
  return response.data;
};

export const setSellerProductPrimaryImage = async (imageId) => {
  const response = await api.patch(`/seller/products/images/${imageId}/set-primary`);
  return response.data;
};

export const getDeliveryCalendar = async (month, year) => {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  const response = await api.get(`/seller/orders/delivery-calendar?${params}`);
  return response.data;
};
