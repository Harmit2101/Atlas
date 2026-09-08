import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { QuickSearchModal } from '@/components/navigation/QuickSearchModal';
import { CustomCursor } from '@/components/cursor/CustomCursor';
import { SmoothScroll } from '@/components/animation/SmoothScroll';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <SmoothScroll>
      <div className="min-h-screen flex flex-col bg-[#08080a] text-[#f4f2ec] relative selection:bg-[#c5a880]/30 selection:text-[#f4f2ec]">
        <CustomCursor />
        <Header onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 pt-20">
          {children}
        </main>
        <Footer />
        <QuickSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </SmoothScroll>
  );
};
