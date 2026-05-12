import api from './axios';
import { getCurrentRole, isSellerRole } from '../utils/auth';

export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const updateProfile = async (payload) => {
  const role = getCurrentRole();
  const endpoint = isSellerRole(role) ? '/profile/seller' : '/profile/user';
  const response = await api.put(endpoint, payload);
  return response.data;
};
