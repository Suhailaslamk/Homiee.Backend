import React from 'react';
import { motion } from 'framer-motion';

export default function SurfaceCard({ children, className = '', onClick, ...props }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={`border border-[var(--color-stone)]/10 bg-white p-8 shadow-sm ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.section>
  );
}
