import React from 'react';

export default function SurfaceCard({ children, className = '' }) {
  return <section className={`rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm ${className}`}>{children}</section>;
}
