import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Globe, Mail, Share2, Heart } from 'lucide-react';
import { getCurrentRole, getWorkspacePath } from '../utils/auth';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[#ecd9cd] bg-[#fffaf2] px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#b85c38] text-white shadow-lg">
                <ShoppingBag size={22} />
              </div>
              <span className="text-2xl font-black tracking-tight text-stone-900">Homiee</span>
            </Link>
            <p className="text-sm leading-7 text-stone-500 font-medium">
              Supporting the local heartbeat. We connect neighborhood creators with customers who value craftsmanship and community.
            </p>
            <div className="flex gap-4">
              <SocialLink icon={<Globe size={20} />} />
              <SocialLink icon={<Mail size={20} />} />
              <SocialLink icon={<Share2 size={20} />} />
            </div>
          </div>

          <FooterGroup title="Marketplace">
            <FooterLink to="/discovery">All Products</FooterLink>
            <FooterLink to="/discovery?category=Handicrafts">Handicrafts</FooterLink>
            <FooterLink to="/discovery?category=Food">Homemade Food</FooterLink>
            <FooterLink to="/discovery?category=Fashion">Slow Fashion</FooterLink>
          </FooterGroup>

          <FooterGroup title="Community">
            <FooterLink to="/signup/seller">Become a Seller</FooterLink>
            <FooterLink to="/login">Partner Login</FooterLink>
            <FooterLink to="/about">Our Story</FooterLink>
            <FooterLink to="/impact">Social Impact</FooterLink>
          </FooterGroup>

          <FooterGroup title="Support">
            <FooterLink to="/help">Help Center</FooterLink>
            <FooterLink to="/safety">Safety & Trust</FooterLink>
            <FooterLink to="/returns">Return Policy</FooterLink>
            <FooterLink to="/contact">Contact Us</FooterLink>
          </FooterGroup>

          {localStorage.getItem('token') && (
            <FooterGroup title="Account">
              <FooterLink to="/profile">Profile Settings</FooterLink>
              {getCurrentRole() === 'user' && <FooterLink to="/orders">My Orders</FooterLink>}
              {getCurrentRole() === 'user' && <FooterLink to="/wishlist">My Wishlist</FooterLink>}
              {(getCurrentRole() === 'seller' || getCurrentRole() === 'admin') && (
                <FooterLink to={getWorkspacePath(getCurrentRole())}>Workspace</FooterLink>
              )}
            </FooterGroup>
          )}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-[#ecd9cd] pt-8 md:flex-row">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
            © 2026 Homiee Technologies. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
            Made with <Heart size={14} className="text-rose-500 fill-rose-500" /> for local creators
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, children }) {
  return (
    <div className="space-y-6">
      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400">{title}</h3>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link to={to} className="text-sm font-bold text-stone-600 transition hover:text-[#b85c38]">
      {children}
    </Link>
  );
}

function SocialLink({ icon }) {
  return (
    <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8c9ba] bg-white text-stone-600 transition hover:bg-[#b85c38] hover:text-white hover:border-[#b85c38] shadow-sm">
      {icon}
    </button>
  );
}
