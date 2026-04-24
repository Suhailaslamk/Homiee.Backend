import React from 'react';

const STYLES = {
  approved: 'bg-emerald-50 text-emerald-700',
  active: 'bg-emerald-50 text-emerald-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  paid: 'bg-emerald-50 text-emerald-700',
  submitted: 'bg-amber-50 text-amber-700',
  processing: 'bg-amber-50 text-amber-700',
  pending: 'bg-amber-50 text-amber-700',
  placed: 'bg-blue-50 text-blue-700',
  shipped: 'bg-blue-50 text-blue-700',
  blocked: 'bg-rose-50 text-rose-700',
  rejected: 'bg-rose-50 text-rose-700',
  suspended: 'bg-rose-50 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-700',
  deleted: 'bg-slate-100 text-slate-700',
};

export default function StatusPill({ value }) {
  const normalized = String(value ?? 'Unknown').toLowerCase();
  const classes = STYLES[normalized] ?? 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${classes}`}>
      {value ?? 'Unknown'}
    </span>
  );
}
