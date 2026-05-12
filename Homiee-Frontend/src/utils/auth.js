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
  const role = payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload?.role || null;
  return role ? role.toLowerCase() : null;
}

export function getCurrentUserId() {
  const payload = getDecodedToken();
  const rawUserId =
    payload?.userId ||
    payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
    payload?.nameid ||
    payload?.sub;

  const parsedUserId = Number(rawUserId);
  return Number.isFinite(parsedUserId) ? parsedUserId : null;
}
 
export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

export function isCustomerRole(role = getCurrentRole()) {
  return role === 'user';
}

export function isSellerRole(role = getCurrentRole()) {
  return role === 'seller';
}

export function isAdminRole(role = getCurrentRole()) {
  return role === 'admin';
}

export function isDeliveryRole(role = getCurrentRole()) {
  return role === 'deliverypartner';
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

export function clearAuthSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('sellerOnboardingStatus');
  // Clear any role-specific state if needed
}

export function handleAuthError() {
  clearAuthSession();
  // Instead of forcing to /login, we reload to downgrade to guest state.
  // The ProtectedRoute guard in App.jsx will handle redirects ONLY if the user is on a protected page.
  window.location.reload();
}

export function forceLogout() {
  clearAuthSession();
  window.location.href = '/login';
}

