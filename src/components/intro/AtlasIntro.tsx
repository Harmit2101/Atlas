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

    // Step 0: Pitch black (0ms)
    // Step 1: Tiny ATLAS mark appears in absolute center (250ms)
    const t1 = setTimeout(() => setStep(1), 250);
    // Step 2: Subtle coordinate crosshairs & orbital geometry expand (600ms)
    const t2 = setTimeout(() => setStep(2), 600);
    // Step 3: Atmosphere glow and constellation points illuminate (1100ms)
    const t3 = setTimeout(() => setStep(3), 1100);
    // Step 4: Full ATLAS wordmark & "THE WORLD IS YOUR MARKET" resolves (1600ms)
    const t4 = setTimeout(() => setStep(4), 1600);
    // Step 5: Dissolve cleanly into interactive interface (2300ms)
    const t5 = setTimeout(() => {
      setShowIntro(false);
      sessionStorage.setItem('atlas_intro_shown', 'true');
    }, 2300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
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
            {/* Ambient subtle warm gold atmosphere glow */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ 
                scale: step >= 3 ? 1.3 : step >= 1 ? 0.7 : 0.3, 
                opacity: step >= 3 ? 0.4 : step >= 1 ? 0.2 : 0 
              }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              className="absolute w-[600px] h-[600px] rounded-full bg-[#c5a880]/15 blur-[120px] pointer-events-none"
            />

            {/* Subtle Crosshair Coordinate Lines */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: step >= 2 ? 0.2 : 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
            >
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#c5a880] to-transparent" />
              <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-[#c5a880] to-transparent absolute" />
            </motion.div>

            {/* Astrolabe Geometry / Concentric Orbital Rings */}
            <div className="relative flex items-center justify-center">
              {/* Thin Inner Ring */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: 0 }}
                animate={{
                  scale: step >= 2 ? 1 : 0.5,
                  opacity: step >= 2 ? 0.5 : 0,
                  rotate: step >= 2 ? 120 : 0
                }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
                className="w-36 h-36 rounded-full border border-[#c5a880]/40 border-dashed absolute"
              />

              {/* Thin Outer Ring */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0, rotate: 0 }}
                animate={{
                  scale: step >= 2 ? 1.2 : 0.8,
                  opacity: step >= 2 ? 0.3 : 0,
                  rotate: step >= 2 ? -90 : 0
                }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
                className="w-52 h-52 rounded-full border border-[#c5a880]/20 absolute"
              />

              {/* Center Tiny ATLAS Mark (Step 1) transitioning into full Wordmark (Step 4) */}
              <div className="relative text-center z-10 space-y-4">
                {step < 4 ? (
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ 
                      scale: step >= 1 ? 1 : 0.6, 
                      opacity: step >= 1 ? 1 : 0 
                    }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-8 h-8 rounded-full border border-[#c5a880]/60 flex items-center justify-center text-[#c5a880] font-editorial text-xs font-semibold tracking-widest">
                      A
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-2"
                  >
                    <div className="text-[10px] font-mono-luxury uppercase tracking-[0.4em] text-[#c5a880]">
                      GLOBAL ASSET DISCOVERY
                    </div>
                    <h1 className="font-editorial text-5xl sm:text-6xl tracking-[0.35em] text-[#f4f2ec] font-semibold pl-2">
                      ATLAS
                    </h1>
                    <div className="text-xs font-mono-luxury uppercase tracking-[0.25em] text-[#8e8d93] pt-1">
                      THE WORLD IS YOUR MARKET.
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Coordinate Telemetry Coordinates */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: step >= 2 ? 0.45 : 0 }}
              transition={{ duration: 0.6 }}
              className="absolute bottom-10 text-[9px] font-mono-luxury uppercase tracking-widest text-[#8e8d93]"
            >
              LAT 25.2048° N · LON 55.2708° E · CARTOGRAPHIC ORBIT READY
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
};
