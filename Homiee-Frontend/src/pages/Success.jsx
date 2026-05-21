import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Download, Home, Sparkles, CheckCircle2, ShoppingBag, ArrowUpRight, Compass, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Success() {
  return (
    <div className="pt-40 min-h-screen bg-[var(--color-sand)]/10 pb-32 flex flex-col items-center px-6 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--color-accent)] blur-[100px] rounded-full"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse', delay: 1 }}
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-[var(--color-primary-dark)] blur-[100px] rounded-full"
        />
      </div>

      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-2xl w-full relative z-10"
      >
        <motion.div 
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2
          }}
          className="w-32 h-32 bg-[var(--color-primary-dark)] text-[var(--color-accent)] rounded-[2.5rem] flex items-center justify-center mx-auto mb-12 shadow-2xl shadow-[var(--color-primary-dark)]/20 border-4 border-white/50"
        >
          <CheckCircle2 size={64} />
        </motion.div>
        
        <h1 className="text-4xl sm:text-6xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] mb-6 tracking-tight">Order Placed Successfully!</h1>
        <p className="text-lg sm:text-xl text-[var(--color-text-muted)] font-medium mb-12 italic leading-relaxed px-6 sm:px-12">
          "Your order has been placed and is being processed. We'll notify you once your items are on their way."
        </p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/50 backdrop-blur-xl rounded-[4rem] p-12 border border-white shadow-2xl mb-12 text-left relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-sand)]/30 blur-3xl rounded-full -mr-16 -mt-16" />
          
          <div className="space-y-8 relative z-10">
            <div className="flex justify-between items-center pb-6 border-b border-[var(--color-stone)]/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-sand)]/50 flex items-center justify-center text-[var(--color-primary-dark)]">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Order Number</span>
              </div>
              <span className="font-bold text-sm sm:text-base text-[var(--color-primary-dark)] bg-white px-5 py-2 rounded-xl border border-[var(--color-stone)]/5 shadow-sm">#{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-sand)]/50 flex items-center justify-center text-[var(--color-primary-dark)]">
                  <Sparkles size={16} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Estimated Delivery</span>
              </div>
              <span className="font-bold text-[var(--color-accent)]">3 - 7 Business Days</span>
            </div>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          <Link 
            to="/orders" 
            className="group w-full bg-[var(--color-primary-dark)] text-white py-6 rounded-[2rem] font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-[var(--color-primary-dark)]/20"
          >
            Track Order <Package size={22} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            to="/discovery" 
            className="group w-full bg-white border border-[var(--color-stone)]/10 text-[var(--color-primary-dark)] py-6 rounded-[2rem] font-bold text-lg hover:bg-[var(--color-sand)]/20 active:scale-95 transition-all flex items-center justify-center gap-4 shadow-xl"
          >
            Continue Shopping <Compass size={22} className="group-hover:rotate-45 transition-transform duration-700" />
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16 flex items-center justify-center gap-3 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.3em]"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          Payment & Order Secured
        </motion.div>
      </motion.div>
    </div>
  );
}
