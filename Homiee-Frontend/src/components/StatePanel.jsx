import React from 'react';

export default function StatePanel({ message, className = '' }) {
  return (
    <div className={`rounded-[30px] border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm ${className}`}>
      {message}
    </div>
  );
}
