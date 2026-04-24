import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, LogOut, Search, ShoppingCart, User } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import {
  getCurrentRole,
  getWorkspacePath,
  isAdminRole,
  isCustomerRole,
  isDeliveryRole,
  isSellerRole,
} from '../utils/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('token');
  const role = getCurrentRole();

  const showMarketplaceActions = !token || isCustomerRole(role);
  const showWorkspace = isSellerRole(role) || isAdminRole(role);
  const showProfile = token && !isAdminRole(role) ? true : token;

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sellerOnboardingStatus');
    toast.info('You have been signed out.');
    navigate('/');
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-stone-200/80 bg-[#fffaf2]/85 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4">
        <Link to={token ? (showMarketplaceActions ? '/discovery' : getWorkspacePath(role)) : '/'} className="flex items-center gap-3 text-2xl font-black text-[#b85c38]">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4d6c8] text-[#8f3d21] shadow-sm">
            <Home size={20} />
          </span>
          <span>Homiee</span>
        </Link>

        {showMarketplaceActions && (
          <div className="mx-8 hidden max-w-md flex-1 md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 text-stone-400" size={18} />
              <input
                type="text"
                placeholder="Search handmade finds, home stores..."
                className="w-full rounded-full border border-stone-200 bg-[#fff7ee] py-2 pl-10 pr-4 text-stone-700 outline-none transition focus:border-[#d36f51] focus:ring-2 focus:ring-[#f0c7b7]"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 font-medium text-stone-600">
          {token ? (
            <>
              {isCustomerRole(role) && <Link to="/discovery" className="transition hover:text-[#b85c38]">Explore</Link>}

              {isCustomerRole(role) && (
                <Link to="/cart" className="flex items-center gap-1 transition hover:text-[#b85c38]">
                  <ShoppingCart size={18} /> Cart
                </Link>
              )}

              {showWorkspace && (
                <Link to={getWorkspacePath(role)} className="flex items-center gap-1 transition hover:text-[#b85c38]">
                  <LayoutDashboard size={18} /> Workspace
                </Link>
              )}

              {showProfile && (
                <Link to="/profile" className="flex items-center gap-1 transition hover:text-[#b85c38]">
                  <User size={18} /> {isDeliveryRole(role) ? 'Account' : 'Profile'}
                </Link>
              )}

              <button onClick={handleLogout} className="flex items-center gap-1 transition hover:text-rose-700">
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="transition hover:text-[#b85c38]">Login</Link>
              <Link to="/" className="rounded-full bg-[#3f5143] px-5 py-2 text-white transition hover:bg-[#334237]">
                Join Homiee
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
