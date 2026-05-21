import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SplashLoader.css';

const CookieIcon = () => (
  <svg viewBox="0 0 100 100" className="cookie-svg">
    <path 
      d="M50 5 C25 5 5 25 5 50 C5 75 25 95 50 95 C75 95 95 75 95 50 C95 25 75 5 50 5" 
      fill="#d4a373" 
      stroke="#bc8a5f" 
      strokeWidth="2"
      strokeLinecap="round"
      style={{ filter: 'url(#roughness)' }}
    />
    <circle cx="30" cy="35" r="5" fill="#583101" />
    <circle cx="70" cy="40" r="4" fill="#583101" />
    <circle cx="45" cy="70" r="6" fill="#583101" />
    <circle cx="20" cy="60" r="3" fill="#583101" />
    <circle cx="65" cy="75" r="5" fill="#583101" />
    <defs>
      <filter id="roughness">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
      </filter>
    </defs>
  </svg>
);

const CoinIcon = () => (
  <svg viewBox="0 0 100 100" className="coin-svg">
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f3d060" />
        <stop offset="50%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#b8860b" />
      </linearGradient>
      <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.6)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
      <mask id="shimmerMask">
        <circle cx="50" cy="50" r="48" fill="white" />
      </mask>
    </defs>
    
    <circle cx="50" cy="50" r="48" fill="url(#goldGradient)" stroke="#8b6508" strokeWidth="1" />
    <circle cx="50" cy="50" r="40" fill="none" stroke="#8b6508" strokeWidth="0.5" opacity="0.5" />
    
    {/* Embossed Rim Effect */}
    <circle cx="50" cy="50" r="44" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
    
    {/* Animated Shimmer */}
    <motion.rect
      x="-100"
      y="0"
      width="100"
      height="100"
      fill="url(#shimmer)"
      mask="url(#shimmerMask)"
      animate={{ x: ['-100%', '200%'] }}
      transition={{ 
        duration: 2, 
        repeat: Infinity, 
        repeatDelay: 1,
        ease: "easeInOut"
      }}
      style={{ transform: 'rotate(25deg)' }}
    />
  </svg>
);

export default function SplashLoader({ onComplete }) {
  const [isCoin, setIsCoin] = useState(false);

  useEffect(() => {
    // Initial delay before triggering the main sequence if needed
    const timeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, 7000); // Give it enough time to loop once (4s animation + 2s pause + 1s buffer)
    
    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div className="splash-container">
      <motion.div 
        className="logo-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <div className="logo-text">
          <span className="letter">h</span>
          
          <div className="o-wrapper">
            <motion.div
              className="flip-card"
              animate={{ rotateY: 180 }}
              transition={{ 
                duration: 4, 
                ease: [0.65, 0, 0.35, 1.2], // Fast start, slow settle with overshoot
                repeat: Infinity,
                repeatDelay: 2
              }}
              onUpdate={(latest) => {
                // Morph point: swap visibility at 90 degrees
                const rotation = latest.rotateY % 360;
                if (rotation > 90 && rotation < 270) {
                  if (!isCoin) setIsCoin(true);
                } else {
                  if (isCoin) setIsCoin(false);
                }
              }}
            >
              <div className="flip-face flip-front">
                <CookieIcon />
              </div>
              <div className="flip-face flip-back">
                <CoinIcon />
              </div>
            </motion.div>
          </div>

          <span className="letter">m</span>
          <span className="letter">i</span>
          <span className="letter">e</span>
          <span className="letter">e</span>
        </div>
      </motion.div>
    </div>
  );
}
