import React from 'react';

const STYLES = {
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  submitted: 'bg-amber-50 text-amber-700 border-amber-100',
  processing: 'bg-amber-50 text-amber-700 border-amber-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  underreview: 'bg-amber-50 text-amber-700 border-amber-100',
  awaitingverification: 'bg-amber-50 text-amber-700 border-amber-100',
  placed: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  outfordelivery: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  blocked: 'bg-rose-50 text-rose-700 border-rose-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
  suspended: 'bg-rose-50 text-rose-700 border-rose-100',
  cancelled: 'bg-slate-50 text-slate-600 border-slate-100',
  deleted: 'bg-slate-50 text-slate-600 border-slate-100',
};

const DOT_COLORS = {
  approved: 'bg-emerald-500',
  accepted: 'bg-emerald-500',
  active: 'bg-emerald-500',
  delivered: 'bg-emerald-500',
  paid: 'bg-emerald-500',
  submitted: 'bg-amber-500',
  processing: 'bg-amber-500',
  pending: 'bg-amber-500',
  underreview: 'bg-amber-500',
  awaitingverification: 'bg-amber-500',
  placed: 'bg-indigo-500',
  shipped: 'bg-indigo-500',
  outfordelivery: 'bg-indigo-500',
  blocked: 'bg-rose-500',
  rejected: 'bg-rose-500',
  suspended: 'bg-rose-500',
  cancelled: 'bg-slate-400',
  deleted: 'bg-slate-400',
};

export default function StatusPill({ value }) {
  const normalized = String(value ?? 'Unknown').toLowerCase().replace(/\s+/g, '');
  const classes = STYLES[normalized] ?? 'bg-slate-50 text-slate-600 border-slate-100';
  const dotColor = DOT_COLORS[normalized] ?? 'bg-slate-400';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {value ?? 'Unknown'}
    </span>
  );
}
