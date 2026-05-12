import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, ShieldCheck, Zap, ArrowRight, Sparkles, Store, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-[var(--color-sand)]/10 pt-32 pb-24 overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[var(--color-accent)]/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-[var(--color-primary-dark)]/5 blur-[120px] rounded-full" />
      </div>

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <header className="max-w-4xl mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[var(--color-stone)]/5 shadow-sm text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-accent)] mb-8"
          >
            <Sparkles size={14} /> The Homiee Genesis
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-7xl sm:text-8xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] tracking-tighter leading-[1.05]"
          >
            Empowering the <i className="text-[var(--color-accent)]">Artisan</i> heartbeat.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12 text-2xl text-[var(--color-stone)] font-medium leading-relaxed italic max-w-3xl opacity-80"
          >
            "Homiee was born from a simple observation: the most soul-stirring treasures aren't found in factories, but in the hands of our neighbors."
          </motion.p>
        </header>

        <div className="grid gap-24 lg:grid-cols-2 items-center mb-32">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <h2 className="text-5xl font-['Fraunces'] font-semibold text-[var(--color-primary-dark)] leading-tight">Our Orchestration <i className="text-[var(--color-accent)]">Principles</i></h2>
            
            <div className="space-y-10">
              <Principle 
                icon={<Heart />} 
                title="Community First" 
                desc="We prioritize neighborhood connection over industrial convenience, ensuring every transaction strengthens local bonds." 
              />
              <Principle 
                icon={<ShieldCheck />} 
                title="Artisan Integrity" 
                desc="Every studio on our platform is hand-vetted for authenticity, craftsmanship, and commitment to their craft." 
              />
              <Principle 
                icon={<Zap />} 
                title="Radical Transparency" 
                desc="From source to sanctuary, we provide the full narrative of your acquisitions, including direct artisan signals." 
              />
            </div>
          </motion.div>

          <div className="relative">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="aspect-square rounded-[5rem] overflow-hidden shadow-2xl relative z-10 border-8 border-white"
            >
              <img 
                src="https://images.unsplash.com/photo-1541604193435-22587c17066e?q=80&w=1200" 
                alt="Artisan workspace" 
                className="w-full h-full object-cover" 
              />
            </motion.div>
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-[var(--color-accent)] rounded-[4rem] -z-0 opacity-20 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[var(--color-primary-dark)] rounded-full -z-0 opacity-10 blur-xl" />
          </div>
        </div>

        <section className="bg-[var(--color-primary-dark)] rounded-[5rem] p-16 sm:p-24 text-white relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.2)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[100px] rounded-full -mr-48 -mt-48" />
          
          <div className="relative z-10 text-center max-w-3xl mx-auto space-y-10">
            <h3 className="text-5xl sm:text-6xl font-['Fraunces'] font-bold leading-tight">Ready to join the <i className="text-[var(--color-accent)]">movement?</i></h3>
            <p className="text-xl text-white/60 leading-relaxed font-medium italic">
              "Whether you are a creator seeking a stage or a collector seeking soul, your sanctuary is here."
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                to="/signup/seller" 
                className="px-12 py-6 bg-[var(--color-accent)] text-white rounded-full font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[var(--color-accent)]/20 flex items-center justify-center gap-3"
              >
                Launch Studio <ArrowRight size={22} />
              </Link>
              <Link 
                to="/discovery" 
                className="px-12 py-6 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-xl hover:bg-white/20 transition-all flex items-center justify-center gap-3"
              >
                Start Exploring
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Principle({ icon, title, desc }) {
  return (
    <div className="flex gap-8 group">
      <div className="w-16 h-16 rounded-[1.8rem] bg-white border border-[var(--color-stone)]/5 shadow-lg flex items-center justify-center text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all duration-500 shrink-0">
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <div>
        <h4 className="text-2xl font-bold text-[var(--color-primary-dark)] mb-2">{title}</h4>
        <p className="text-lg text-[var(--color-stone)] font-medium italic leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{desc}</p>
      </div>
    </div>
  );
}
