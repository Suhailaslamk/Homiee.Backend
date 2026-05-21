import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Compass, Heart, Home, LayoutDashboard, LogOut, Menu, MessageCircle, Search, ShoppingCart, User, X, ChevronDown, Store, Info, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { getConversations } from '../api/chat';
import NotificationsDropdown from './NotificationsDropdown';
import { getNotifications, markNotificationAsRead } from '../api/notifications';
import { useSignalR } from '../hooks/useSignalR';
import { useToast } from '../hooks/useToast';
import { getHubUrl } from '../utils/realtime';
import logoEmblem from '../assets/logo_emblem.png';
import SearchOverlay from './SearchOverlay';
import { getCart } from '../api/customer';
import { getResponseData } from '../utils/api';
import {
  getCurrentUserId,
  getCurrentRole,
  getWorkspacePath,
  isAdminRole,
  isCustomerRole,
  isDeliveryRole,
  isSellerRole,
} from '../utils/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const token = localStorage.getItem('token');
  const role = getCurrentRole();
  const currentUserId = getCurrentUserId();
  const queryClient = useQueryClient();
  const bellRef = useRef(null);
  const avatarRef = useRef(null);
  
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);

  const showMarketplaceActions = !token || isCustomerRole(role);
  const showWorkspace = isSellerRole(role) || isAdminRole(role);
  const showChat = token && (isCustomerRole(role) || isSellerRole(role));
  const showNotifications = Boolean(token);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cmd + K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  const { data: conversationsResponse } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: getConversations,
    enabled: !!showChat,
    staleTime: 15000,
  });

  const unreadChatCount = normalizeConversations(conversationsResponse).reduce(
    (sum, conversation) => sum + Number(conversation.unreadCount || 0),
    0
  );

  const { data: cartResponse } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: !!token, // Enabled for all authenticated users to show consistent count
    staleTime: 30000,
  });

  const cartItems = getResponseData(cartResponse) || [];
  const cartCount = useMemo(() => 
    cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [cartItems]
  );

  const {
    data: notificationsResponse,
    isLoading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: !!showNotifications,
    staleTime: 15000,
  });

  const notifications = useMemo(
    () => normalizeNotifications(notificationsResponse),
    [notificationsResponse]
  );

  const unreadNotificationCount = notifications.reduce(
    (sum, notification) => sum + (notification.isRead ? 0 : 1),
    0
  );

  const markNotificationReadMutation = useMutation({
    mutationFn: (notificationId) => markNotificationAsRead(notificationId),
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData(['notifications'], (current) => {
        const normalized = normalizeNotifications(current);
        return {
          data: normalized.map((notification) =>
            Number(notification.id) === Number(notificationId)
              ? { ...notification, isRead: true }
              : notification
          ),
        };
      });
    },
    onError: (error) => {
      console.error('Mark notification as read failed:', error);
      toast.error(error.response?.data?.message || 'Unable to update this notification right now.');
    },
  });

  useSignalR(
    getHubUrl('/hubs/notification'),
    (incoming) => {
      const notification = normalizeNotification(incoming);
      if (!notification) return;
      queryClient.setQueryData(['notifications'], (current) => {
        const normalized = normalizeNotifications(current);
        const nextItems = [notification, ...normalized.filter((item) => Number(item.id) !== Number(notification.id))];
        return { data: nextItems };
      });
    },
    { enabled: showNotifications, eventName: 'ReceiveNotification' }
  );

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('sellerOnboardingStatus');
    queryClient.removeQueries({ queryKey: ['chat'] });
    queryClient.removeQueries({ queryKey: ['notifications'] });
    toast.info('You have been signed out.');
    navigate('/');
  };

  const navLinks = [
    { label: 'Shop', path: '/discovery', show: showMarketplaceActions },
    { label: 'Studios', path: '/stores', show: showMarketplaceActions },
    { label: 'How It Works', path: '/about', show: true },
  ].filter(link => link.show);

  return (
    <>
      <nav 
        className={`fixed top-0 z-50 w-full transition-all duration-700 ${
          scrolled 
            ? 'bg-white/80 backdrop-blur-xl py-3 border-b border-[var(--color-stone)]/10 shadow-sm' 
            : 'bg-transparent py-8 border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* LEFT: LOGO */}
          <Link 
            to={token ? (showMarketplaceActions ? '/discovery' : getWorkspacePath(role)) : '/'} 
            className="flex items-center gap-3 shrink-0 group"
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-[var(--color-primary)]/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
              <img 
                src={logoEmblem} 
                alt="Homiee Logo" 
                className="relative h-10 w-10 sm:h-12 sm:w-12 object-contain mix-blend-screen"
                style={{ filter: scrolled ? 'brightness(0.3) sepia(1) hue-rotate(90deg)' : 'none' }} 
                // Note: The emblem color adjustment on light bg might need tuning depending on asset
              />
            </div>
            <span className="hidden sm:inline font-['Fraunces'] text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-primary-dark)]">
              Homiee
            </span>
          </Link>

          {/* CENTER: NAV LINKS */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onMouseEnter={() => setHoveredLink(link.label)}
                onMouseLeave={() => setHoveredLink(null)}
                className="relative py-2 text-sm font-medium text-[var(--color-text-main)] hover:text-[var(--color-primary)] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {link.label}
                {hoveredLink === link.label && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--color-accent)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* RIGHT: ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Search Trigger */}
            {showMarketplaceActions && (
              <button 
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-3 px-4 py-2 bg-[var(--color-sand)]/20 hover:bg-[var(--color-sand)]/40 rounded-full border border-[var(--color-stone)]/5 transition-all group"
              >
                <Search size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]" />
                <span className="hidden sm:inline text-xs font-bold text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]">Quick Search</span>
                <kbd className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded border border-[var(--color-stone)]/20 bg-white text-[10px] font-bold text-[var(--color-text-muted)]">
                  <span className="text-[12px]">⌘</span>K
                </kbd>
              </button>
            )}

            {/* Cart (Mock count for now, update with real query if available) */}
            {token && showMarketplaceActions && (
              <Link 
                to="/cart"
                className="relative p-2 text-[var(--color-text-main)] hover:bg-[var(--color-primary)]/5 rounded-full transition"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--color-surface)]">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {token ? (
              <>
                {/* Notifications */}
                {showNotifications && (
                  <div ref={bellRef} className="relative">
                    <button
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className="relative p-2 text-[var(--color-text-main)] hover:bg-[var(--color-primary)]/5 rounded-full transition"
                    >
                      <Bell size={20} />
                      {unreadNotificationCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-[var(--color-surface)]" />
                      )}
                    </button>
                    {notificationsOpen && (
                      <NotificationsDropdown
                        notifications={notifications}
                        unreadCount={unreadNotificationCount}
                        isLoading={notificationsLoading}
                        error={notificationsError}
                        onRetry={refetchNotifications}
                        onNotificationClick={(notification) => {
                          if (!notification.isRead) markNotificationReadMutation.mutate(notification.id);
                        }}
                        pendingNotificationId={markNotificationReadMutation.isPending ? Number(markNotificationReadMutation.variables) : null}
                      />
                    )}
                  </div>
                )}

                {/* Avatar / Profile Dropdown */}
                <div ref={avatarRef} className="relative hidden sm:block">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 rounded-full border border-black/5 bg-black/5 p-1 pr-3 hover:bg-black/10 transition"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full premium-gradient text-white font-bold text-sm">
                      {(role || 'U').charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 z-50"
                      >
                        <div className="px-3 py-2 border-b border-black/5 mb-2">
                          <p className="text-sm font-semibold text-[var(--color-text-main)] capitalize">{(role || 'Guest')} Account</p>
                        </div>
                        
                        {isCustomerRole(role) && (
                          <>
                            <DropdownItem to="/orders" icon={Package} label="My Orders" />
                            <DropdownItem to="/wishlist" icon={Heart} label="Wishlist" />
                          </>
                        )}
                        {showChat && (
                          <DropdownItem to="/chat" icon={MessageCircle} label="Messages" badge={unreadChatCount} />
                        )}
                        {showWorkspace && (
                          <DropdownItem to={getWorkspacePath(role)} icon={LayoutDashboard} label="Dashboard" />
                        )}
                        {token && !isAdminRole(role) && (
                          <DropdownItem to="/profile" icon={User} label="Profile Settings" />
                        )}
                        
                        <div className="mt-2 border-t border-black/5 pt-2">
                          <button 
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
                          >
                            <LogOut size={16} /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link to="/login" className="text-sm font-semibold text-[var(--color-text-main)] hover:text-[var(--color-primary)] transition">Log in</Link>
                <Link to="/signup/customer" className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)] transition shadow-md shadow-[var(--color-primary)]/20">
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-[var(--color-text-main)] hover:bg-[var(--color-primary)]/5 rounded-full transition md:hidden"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER (Full Screen Glassmorphic) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="fixed inset-0 z-[100] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-white/95 backdrop-blur-2xl" />
            
            <motion.div 
              className="absolute inset-0 flex flex-col p-8 pt-24"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-8 right-8 p-3 bg-[var(--color-sand)]/30 rounded-full text-[var(--color-primary-dark)]"
              >
                <X size={24} />
              </button>

              <div className="space-y-12">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)] mb-8 ml-2">Navigation</p>
                  <div className="space-y-4">
                    {navLinks.map((link, i) => (
                      <motion.div
                        key={link.label}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                      >
                        <Link 
                          to={link.path}
                          className="text-5xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] hover:text-[var(--color-accent)] transition-colors block"
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="pt-12 border-t border-[var(--color-stone)]/10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)] mb-8 ml-2">Account</p>
                  <div className="grid grid-cols-2 gap-4">
                    {token ? (
                      <>
                        <MobileActionCard to="/profile" icon={User} label="Profile" />
                        {isCustomerRole(role) && <MobileActionCard to="/orders" icon={Package} label="Orders" />}
                        <MobileActionCard to="/wishlist" icon={Heart} label="Wishlist" />
                        <MobileActionCard to="/chat" icon={MessageCircle} label="Messages" badge={unreadChatCount} />
                        {showWorkspace && <MobileActionCard to={getWorkspacePath(role)} icon={LayoutDashboard} label="Dashboard" />}
                        <button 
                          onClick={handleLogout}
                          className="col-span-2 mt-4 p-4 rounded-3xl bg-rose-50 text-rose-600 font-bold flex items-center justify-center gap-3"
                        >
                          <LogOut size={18} /> Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" className="col-span-1 p-6 rounded-3xl bg-[var(--color-sand)]/30 text-[var(--color-primary-dark)] font-bold text-center">Log in</Link>
                        <Link to="/signup/customer" className="col-span-1 p-6 rounded-3xl bg-[var(--color-primary-dark)] text-white font-bold text-center">Sign up</Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] border-t border-[var(--color-stone)]/10 pt-8">
                <span>© 2026 Homiee Artisan</span>
                <span className="flex items-center gap-2">
                  <Info size={12} /> Support
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEARCH OVERLAY */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function DropdownItem({ to, icon: Icon, label, badge }) {
  return (
    <Link 
      to={to} 
      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-text-main)] hover:bg-black/5 transition"
    >
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-[var(--color-text-muted)]" />
        {label}
      </div>
      {badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function MobileActionCard({ to, icon: Icon, label, badge }) {
  return (
    <Link 
      to={to} 
      className="flex flex-col items-center justify-center p-6 bg-[var(--color-sand)]/20 rounded-[32px] gap-3 hover:bg-[var(--color-sand)]/40 transition-colors relative"
    >
      <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[var(--color-primary)] shadow-sm">
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary-dark)]">{label}</span>
      {badge > 0 && (
        <span className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function normalizeConversations(response) {
  const data = Array.isArray(response) ? response : response?.data;
  return Array.isArray(data) ? data.filter(Boolean) : [];
}

function normalizeNotifications(response) {
  const data = Array.isArray(response) ? response : response?.data;
  return Array.isArray(data) ? data.filter(Boolean) : [];
}

function normalizeNotification(response) {
  if (!response) return null;
  return response.data ?? response;
}
