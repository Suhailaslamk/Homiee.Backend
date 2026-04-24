export function getDecodedToken() {
  const token = localStorage.getItem('token');

  if (!token) {
    return null;
  }

  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function getCurrentRole() {
  const payload = getDecodedToken();
  return payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload?.role || null;
}

export function isCustomerRole(role = getCurrentRole()) {
  return role === 'User';
}

export function isSellerRole(role = getCurrentRole()) {
  return role === 'Seller';
}

export function isAdminRole(role = getCurrentRole()) {
  return role === 'Admin';
}

export function isDeliveryRole(role = getCurrentRole()) {
  return role === 'DeliveryPartner';
}

export function getWorkspacePath(role = getCurrentRole()) {
  if (isAdminRole(role)) return '/admin/dashboard';
  if (isSellerRole(role)) return '/seller/dashboard';
  return '/profile';
}

export function getDefaultAuthenticatedPath(role = getCurrentRole()) {
  if (isAdminRole(role)) return '/admin/dashboard';
  if (isSellerRole(role)) return '/seller/dashboard';
  if (isDeliveryRole(role)) return '/profile';
  return '/discovery';
}
