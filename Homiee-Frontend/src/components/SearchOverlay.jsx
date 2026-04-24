import React, { useState } from 'react';
import { Search, X, ArrowUpRight, Store, Package, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = useState("");

  // Mock results for both products and businesses
  const results = {
    products: [
      { id: 1, name: "Aviator Classic", shop: "Daor", price: "$129" },
      { id: 2, name: "Luxury Keyring", shop: "Loco Motion", price: "$45" }
    ],
    shops: [
      { id: 1, name: "Loco Motion", category: "Automotive" },
      { id: 2, name: "Daor Eyewear", category: "Luxury" }
    ]
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl p-6 lg:p-20"
        >
          <div className="max-w-4xl mx-auto">
            {/* SEARCH INPUT */}
            <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-4 mb-10">
              <Search size={32} className="text-slate-900" />
              <input 
                autoFocus
                placeholder="Search products, brands, or sellers..."
                className="flex-1 bg-transparent text-3xl font-black outline-none placeholder:text-slate-200"
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
                <X size={32} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* LEFT: PRODUCTS & RECENT */}
              <div>
                <SectionHeader icon={Package} title="Suggested Products" />
                <div className="space-y-4 mt-6">
                  {results.products.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl cursor-pointer transition group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-500">in {p.shop}</p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900 group-hover:text-blue-600">{p.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: SHOPS & TRENDS */}
              <div>
                <SectionHeader icon={Store} title="Partner Stores" />
                <div className="space-y-4 mt-6">
                  {results.shops.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl cursor-pointer hover:bg-blue-600 transition">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center font-black">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="font-bold">{s.name}</p>
                          <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">{s.category}</p>
                        </div>
                      </div>
                      <ArrowUpRight size={18} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 text-slate-400">
    <Icon size={18} />
    <span className="text-xs font-black uppercase tracking-[0.2em]">{title}</span>
  </div>
);