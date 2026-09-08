import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AtlasIntroProps {
  children: React.ReactNode;
}

export const AtlasIntro: React.FC<AtlasIntroProps> = ({ children }) => {
  const prefersReduced = useReducedMotion();
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (prefersReduced) return false;
    return !sessionStorage.getItem('atlas_intro_shown');
  });

  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!showIntro) return;

    // Step 0: Initial black screen (0ms)
    // Step 1: Coordinate lines appear (300ms)
    const t1 = setTimeout(() => setStep(1), 300);
    // Step 2: ATLAS logo + celestial ring emerge (800ms)
    const t2 = setTimeout(() => setStep(2), 800);
    // Step 3: Tagline reveals (1400ms)
    const t3 = setTimeout(() => setStep(3), 1400);
    // Step 4: Complete transition (2200ms)
    const t4 = setTimeout(() => {
      setShowIntro(false);
      sessionStorage.setItem('atlas_intro_shown', 'true');
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [showIntro]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showIntro && (
          <motion.div
            key="atlas-intro-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[99999] bg-[#08080a] flex flex-col items-center justify-center select-none overflow-hidden"
          >
            {/* Ambient subtle glow aura */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: step >= 2 ? 1.2 : 0.8, opacity: step >= 2 ? 0.35 : 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute w-[500px] h-[500px] rounded-full bg-[#c5a880]/15 blur-[100px] pointer-events-none"
            />

            {/* Subtle Crosshair Coordinate Lines */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: step >= 1 ? 0.25 : 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
            >
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#c5a880] to-transparent" />
              <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-[#c5a880] to-transparent absolute" />
            </motion.div>

            {/* Central Animated Rotating Rings / Astrolabe Geometry */}
            <div className="relative flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.7, opacity: 0, rotate: 0 }}
                animate={{
                  scale: step >= 1 ? 1 : 0.7,
                  opacity: step >= 1 ? 0.6 : 0,
                  rotate: step >= 1 ? 90 : 0
                }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                className="w-40 h-40 rounded-full border border-[#c5a880]/40 border-dashed absolute"
              />

              <motion.div
                initial={{ scale: 0.9, opacity: 0, rotate: 0 }}
                animate={{
                  scale: step >= 2 ? 1.15 : 0.9,
                  opacity: step >= 2 ? 0.4 : 0,
                  rotate: step >= 2 ? -90 : 0
                }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                className="w-48 h-48 rounded-full border border-[#c5a880]/20 absolute"
              />

              {/* ATLAS Brand Wordmark Reveal */}
              <div className="relative text-center z-10 space-y-3">
                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: step >= 2 ? 0 : 15, opacity: step >= 2 ? 1 : 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="text-[10px] font-mono-luxury uppercase tracking-[0.4em] text-[#c5a880] mb-1">
                    GLOBAL ASSET INTELLIGENCE
                  </div>
                  <h1 className="font-editorial text-5xl sm:text-6xl tracking-[0.35em] text-[#f4f2ec] font-semibold pl-2">
                    ATLAS
                  </h1>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: step >= 3 ? 1 : 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-xs font-mono-luxury uppercase tracking-[0.25em] text-[#8e8d93]"
                >
                  THE WORLD IS YOUR MARKET.
                </motion.div>
              </div>
            </div>

            {/* Coordinate Telemetry Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: step >= 1 ? 0.5 : 0 }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-10 text-[9px] font-mono-luxury uppercase tracking-widest text-[#8e8d93]"
            >
              LAT 25.2048° N · LON 55.2708° E · INITIALIZING
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
};
