import api from './axios';

export const getProducts = async (query = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page);
  if (query.pageSize) params.append('pageSize', query.pageSize);
  if (query.categoryId) params.append('categoryId', query.categoryId);
  if (query.minPrice) params.append('minPrice', query.minPrice);
  if (query.maxPrice) params.append('maxPrice', query.maxPrice);
  if (query.search) params.append('search', query.search);

  const response = await api.get(`/marketplace/products?${params}`);
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/marketplace/products/${id}`);
  return response.data;
};

export const getSellerById = async (id) => {
  const response = await api.get(`/marketplace/sellers/${id}`);
  return response.data;
};

export const getSellers = async (query = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page);
  if (query.pageSize) params.append('pageSize', query.pageSize);
  if (query.search) params.append('search', query.search);
  if (query.categoryId) params.append('categoryId', query.categoryId);

  const response = await api.get(`/marketplace/sellers?${params}`);
  return response.data;
};

export const getSellerProducts = async (sellerId, query = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page);
  if (query.pageSize) params.append('pageSize', query.pageSize);
  if (query.minPrice) params.append('minPrice', query.minPrice);
  if (query.maxPrice) params.append('maxPrice', query.maxPrice);
  if (query.search) params.append('search', query.search);

  const response = await api.get(`/marketplace/sellers/${sellerId}/products?${params}`);
  return response.data;
};
