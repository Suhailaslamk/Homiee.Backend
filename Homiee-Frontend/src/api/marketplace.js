import api from './axios';

function appendIfPresent(params, key, value) {
  if (value === undefined || value === null || value === '' || Number.isNaN(value)) {
    return;
  }

  params.append(key, value);
}

export const getProducts = async (query = {}) => {
  const params = new URLSearchParams();
  appendIfPresent(params, 'page', query.page);
  appendIfPresent(params, 'pageSize', query.pageSize);
  appendIfPresent(params, 'search', query.search);
  appendIfPresent(params, 'categoryId', query.categoryId);
  appendIfPresent(params, 'minPrice', query.minPrice);
  appendIfPresent(params, 'maxPrice', query.maxPrice);
  appendIfPresent(params, 'sortBy', query.sortBy);
  appendIfPresent(params, 'desc', query.desc);
  appendIfPresent(params, 'inStockOnly', query.inStockOnly);
  appendIfPresent(params, 'minRating', query.minRating);

  const response = await api.get(`/marketplace/products?${params}`);
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/marketplace/categories');
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/marketplace/products/${id}`);
  return response.data;
};

export const getProductReviews = async (id) => {
  const response = await api.get(`/marketplace/products/${id}/reviews`);
  return response.data;
};

export const getRecommendations = async (productId, topN = 4) => {
  const response = await api.get(`/products/${productId}/recommendations?topN=${topN}`);
  return response.data;
};

export const addProductReview = async (id, payload) => {
  const response = await api.post(`/marketplace/products/${id}/review`, payload);
  return response.data;
};

export const getSellerById = async (id) => {
  const response = await api.get(`/marketplace/sellers/${id}`);
  return response.data;
};

export const getSellers = async (query = {}) => {
  const params = new URLSearchParams();
  appendIfPresent(params, 'page', query.page);
  appendIfPresent(params, 'pageSize', query.pageSize);
  appendIfPresent(params, 'search', query.search);
  appendIfPresent(params, 'categoryId', query.categoryId);

  const response = await api.get(`/marketplace/sellers?${params}`);
  return response.data;
};

export const getStores = async (query = {}) => {
  const params = new URLSearchParams();
  appendIfPresent(params, 'page', query.page);
  appendIfPresent(params, 'pageSize', query.pageSize);
  appendIfPresent(params, 'search', query.search);
  appendIfPresent(params, 'lat', query.lat);
  appendIfPresent(params, 'lng', query.lng);
  appendIfPresent(params, 'radiusKm', query.radiusKm);
  appendIfPresent(params, 'sortBy', query.sortBy);
  appendIfPresent(params, 'categoryId', query.categoryId);
  appendIfPresent(params, 'minRating', query.minRating);

  const response = await api.get(`/marketplace/stores?${params}`);
  return response.data;
};

export const getStoreDetails = async (sellerId, query = {}) => {
  const params = new URLSearchParams();
  appendIfPresent(params, 'page', query.page);
  appendIfPresent(params, 'pageSize', query.pageSize);
  appendIfPresent(params, 'minPrice', query.minPrice);
  appendIfPresent(params, 'maxPrice', query.maxPrice);
  appendIfPresent(params, 'search', query.search);
  appendIfPresent(params, 'sortBy', query.sortBy);
  appendIfPresent(params, 'desc', query.desc);
  appendIfPresent(params, 'categoryId', query.categoryId);
  appendIfPresent(params, 'inStockOnly', query.inStockOnly);
  appendIfPresent(params, 'minRating', query.minRating);

  const response = await api.get(`/marketplace/stores/${sellerId}?${params}`);
  return response.data;
};

export const getSellerProducts = async (sellerId, query = {}) => {
  const params = new URLSearchParams();
  appendIfPresent(params, 'page', query.page);
  appendIfPresent(params, 'pageSize', query.pageSize);
  appendIfPresent(params, 'minPrice', query.minPrice);
  appendIfPresent(params, 'maxPrice', query.maxPrice);
  appendIfPresent(params, 'search', query.search);
  appendIfPresent(params, 'sortBy', query.sortBy);
  appendIfPresent(params, 'desc', query.desc);
  appendIfPresent(params, 'categoryId', query.categoryId);
  appendIfPresent(params, 'inStockOnly', query.inStockOnly);
  appendIfPresent(params, 'minRating', query.minRating);

  const response = await api.get(`/marketplace/sellers/${sellerId}/products?${params}`);
  return response.data;
};

export const getSellerReviews = async (sellerId) => {
  const response = await api.get(`/marketplace/sellers/${sellerId}/reviews`);
  return response.data;
};

export const addSellerReview = async (sellerId, payload) => {
  const response = await api.post(`/marketplace/sellers/${sellerId}/review`, payload);
  return response.data;
};
