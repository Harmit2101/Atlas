import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const CustomCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [cursorText, setCursorText] = useState('');
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Detect touch capability
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouch(true);
      return;
    }

    const updateMouse = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Check target element for custom data-cursor attribute or interactive tags
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorLabel = target.closest('[data-cursor]')?.getAttribute('data-cursor');
      if (cursorLabel) {
        setCursorText(cursorLabel);
        setIsHovered(true);
      } else if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT'
      ) {
        setCursorText('');
        setIsHovered(true);
      } else {
        setCursorText('');
        setIsHovered(false);
      }
    };

    window.addEventListener('mousemove', updateMouse);
    return () => window.removeEventListener('mousemove', updateMouse);
  }, []);

  if (isTouch) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center rounded-full"
      animate={{
        x: mousePosition.x - (cursorText ? 28 : isHovered ? 16 : 5),
        y: mousePosition.y - (cursorText ? 28 : isHovered ? 16 : 5),
        width: cursorText ? 56 : isHovered ? 32 : 10,
        height: cursorText ? 56 : isHovered ? 32 : 10,
        backgroundColor: cursorText
          ? 'rgba(197, 168, 128, 0.92)'
          : isHovered
          ? 'rgba(197, 168, 128, 0.25)'
          : 'rgba(244, 242, 236, 0.85)',
        border: cursorText || isHovered ? '1px solid rgba(197, 168, 128, 0.6)' : 'none'
      }}
      transition={{
        type: 'spring',
        stiffness: 450,
        damping: 32,
        mass: 0.5
      }}
    >
      {cursorText && (
        <span className="text-[9px] font-mono-luxury font-semibold uppercase tracking-wider text-[#08080a] select-none">
          {cursorText}
        </span>
      )}
    </motion.div>
  );
};
