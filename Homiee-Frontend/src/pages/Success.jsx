import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Success() {
  return (
    <div className="pt-32 min-h-screen bg-white pb-20 flex flex-col items-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-lg px-6"
      >
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-50">
          <CheckCircle size={48} />
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 mb-4">Order Confirmed!</h1>
        <p className="text-slate-500 text-lg mb-10">
          Thank you for your purchase. We've sent a receipt to your email. Your items are being prepared by the merchants.
        </p>

        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 mb-10 text-left">
          <div className="flex justify-between mb-4">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Order ID</span>
            <span className="font-bold text-slate-900">#ORD-7701-X</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Estimated Delivery</span>
            <span className="font-bold text-slate-900">April 22 - April 25</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Link to="/profile" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition flex items-center justify-center gap-2">
            Track My Order <Package size={20} />
          </Link>
          <button className="flex items-center justify-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition">
            <Download size={18} /> Download Invoice
          </button>
        </div>
      </motion.div>
    </div>
  );
}