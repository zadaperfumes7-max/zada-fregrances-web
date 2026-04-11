import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface CinematicIntroProps {
  onComplete: () => void;
}

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 1000); // Wait for fade out animation
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden"
        >
          {/* Background subtle glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.3, scale: 1.2 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute inset-0 bg-radial-gradient from-orange-500/20 to-transparent pointer-events-none"
          />

          <div className="relative flex flex-col items-center">
            {/* Main Logo Text */}
            <motion.div
              initial={{ opacity: 0, y: 20, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "1em" }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="text-white text-6xl md:text-8xl font-light tracking-[1em] ml-[1em]"
            >
              ZÀDA
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="mt-8 text-white/60 text-sm uppercase tracking-[0.3em] font-light"
            >
              Exquisite Fragrances
            </motion.div>

            {/* Animated Line */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100px", opacity: 1 }}
              transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
              className="mt-6 h-[1px] bg-gradient-to-r from-transparent via-orange-500 to-transparent"
            />
          </div>

          {/* Particle-like subtle elements */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0, 
                x: Math.random() * window.innerWidth, 
                y: Math.random() * window.innerHeight 
              }}
              animate={{ 
                opacity: [0, 0.3, 0],
                y: "-=100",
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              className="absolute w-1 h-1 bg-white rounded-full pointer-events-none"
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
