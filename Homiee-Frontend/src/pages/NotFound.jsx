import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, ArrowLeft, Ghost } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center px-6 overflow-hidden relative">
      {/* Decorative blurred circles */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#f4d6c8] rounded-full blur-[100px] opacity-30" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#e3eee5] rounded-full blur-[100px] opacity-30" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-xl w-full text-center relative z-10"
      >
        <div className="relative mb-12">
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-32 h-32 bg-white rounded-[40px] border border-[#e8c9ba] shadow-2xl flex items-center justify-center mx-auto text-[#b85c38]"
          >
            <Ghost size={64} strokeWidth={1.5} />
          </motion.div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-stone-900/5 blur-md rounded-full" />
        </div>

        <h1 className="text-8xl font-black text-stone-900 tracking-tighter mb-4">404</h1>
        <h2 className="text-3xl font-black text-stone-800 mb-6 tracking-tight">Lost in the Neighborhood?</h2>
        <p className="text-stone-500 text-lg mb-12 leading-relaxed font-medium">
          The page you're looking for has moved out or never existed. Let's get you back to the familiar streets of Homiee.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center justify-center gap-3 bg-stone-900 text-white px-8 py-5 rounded-2xl font-black hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10"
          >
            <Home size={20} /> Back Home
          </button>
          
          <button 
            onClick={() => navigate('/discovery')} 
            className="flex items-center justify-center gap-3 bg-white border border-[#e8c9ba] text-stone-800 px-8 py-5 rounded-2xl font-black hover:bg-[#fff7ee] hover:border-[#b85c38] transition-all shadow-sm"
          >
            <Search size={20} /> Browse Marketplace
          </button>
        </div>

        <button 
          onClick={() => navigate(-1)}
          className="mt-12 inline-flex items-center gap-2 text-stone-400 font-bold uppercase tracking-widest text-[10px] hover:text-[#b85c38] transition-colors"
        >
          <ArrowLeft size={14} /> Go Back to Previous Page
        </button>
      </motion.div>
    </div>
  );
}
