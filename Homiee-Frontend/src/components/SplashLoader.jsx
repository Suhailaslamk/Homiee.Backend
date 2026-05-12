import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './SplashLoader.css';
import cookieImg from '../assets/cookie.png';
import coinImg from '../assets/gold_coin.png';

export default function SplashLoader({ onComplete }) {
  const [stage, setStage] = useState('initial'); // initial, spinning, settled, final

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage('spinning'), 500),      // 0.5s: Start smooth 3D spin
      setTimeout(() => setStage('settled'), 3000),      // 3.0s: Spin finishes
      setTimeout(() => setStage('final'), 3500),        // 3.5s: Glow/Trace effect
      setTimeout(() => onComplete(), 4500),             // 4.5s: Complete and exit
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="splash-container">
      <div className="splash-lighting" />
      
      <div className="logo-wrapper">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="logo-content"
        >
          {/* SVG Border Drawing Effect */}
          <svg className="logo-svg-border" viewBox="0 0 400 100">
            <motion.text
              x="50%"
              y="70%"
              textAnchor="middle"
              className="svg-text-path"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={stage === 'final' ? { pathLength: 1, opacity: 0.2 } : {}}
              transition={{ duration: 1.0, ease: "easeInOut" }}
            >
              homiee
            </motion.text>
          </svg>

          <div className="logo-text">
            <span className="letter">h</span>
            
            <div className="o-position">
              <motion.div
                className="flip-container"
                initial={{ rotateY: 0 }}
                animate={{ 
                  rotateY: stage === 'spinning' || stage === 'settled' || stage === 'final' ? 540 : 0 // 1.5 rotations
                }}
                transition={{ 
                  rotateY: { 
                    duration: 2.5, 
                    ease: [0.65, 0, 0.35, 1] 
                  }
                }}
              >
                {/* Front Side: Cookie */}
                <div className="flip-side flip-front">
                  <img src={cookieImg} alt="" className="blended-asset" />
                </div>
                
                {/* Back Side: Coin */}
                <div className="flip-side flip-back">
                  <img src={coinImg} alt="" className="blended-asset coin-glow" />
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
    </div>
  );
}
