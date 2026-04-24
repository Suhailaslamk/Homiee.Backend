import api from './axios';

export const getAdminDashboard = async () => {
  const response = await api.get('/dashboard/admin');
  return response.data;
};

export const getAdminSellers = async (query = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page);
  if (query.pageSize) params.append('pageSize', query.pageSize);
  if (query.search) params.append('search', query.search);
  if (query.status) params.append('status', query.status);

  const response = await api.get(`/admin/sellers?${params}`);
  return response.data;
};

export const getAdminSellerById = async (userId) => {
  const response = await api.get(`/admin/sellers/${userId}`);
  return response.data;
};

export const approveSeller = async (userId) => {
  const response = await api.post(`/admin/sellers/${userId}/approve`);
  return response.data;
};

export const rejectSeller = async (userId, reason) => {
  const response = await api.post(`/admin/sellers/${userId}/reject`, reason, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

export const suspendSeller = async (userId, reason) => {
  const response = await api.post(`/admin/suspend/${userId}`, reason, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

export const getAdminCustomers = async (query = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page);
  if (query.pageSize) params.append('pageSize', query.pageSize);
  if (query.search) params.append('search', query.search);
  if (query.status) params.append('status', query.status);

  const response = await api.get(`/admin/customers?${params}`);
  return response.data;
};

export const getAdminCustomerById = async (id) => {
  const response = await api.get(`/admin/customers/${id}`);
  return response.data;
};

export const getAdminCustomerOrders = async (id) => {
  const response = await api.get(`/admin/customers/${id}/orders`);
  return response.data;
};

export const blockCustomer = async (id, reason) => {
  const response = await api.patch(`/admin/customers/${id}/block`, reason ?? '', {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};

export const unblockCustomer = async (id) => {
  const response = await api.patch(`/admin/customers/${id}/unblock`);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await api.delete(`/admin/customers/${id}`);
  return response.data;
};

export const getAdminOrders = async (query = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page);
  if (query.pageSize) params.append('pageSize', query.pageSize);
  if (query.status) params.append('status', query.status);

  const response = await api.get(`/admin/orders?${params}`);
  return response.data;
};

export const updateAdminOrderStatus = async (id, status) => {
  const response = await api.patch(`/admin/orders/${id}/status`, { status });
  return response.data;
};

export const getAdminProducts = async (query = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page);
  if (query.pageSize) params.append('pageSize', query.pageSize);
  if (query.search) params.append('search', query.search);
  if (query.status) params.append('status', query.status);

  const response = await api.get(`/admin/products?${params}`);
  return response.data;
};

export const getAdminProductById = async (id) => {
  const response = await api.get(`/admin/products/${id}`);
  return response.data;
};

export const deleteAdminProduct = async (id) => {
  const response = await api.delete(`/admin/products/${id}`);
  return response.data;
};

export const getAdminCategories = async () => {
  const response = await api.get('/admin/categories');
  return response.data;
};

export const createAdminCategory = async (payload) => {
  const response = await api.post('/admin/categories', payload);
  return response.data;
};

export const updateAdminCategory = async (id, payload) => {
  const response = await api.put(`/admin/categories/${id}`, payload);
  return response.data;
};

export const toggleAdminCategory = async (id) => {
  const response = await api.patch(`/admin/categories/${id}/toggle`);
  return response.data;
};
