import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { QuickSearchModal } from '@/components/navigation/QuickSearchModal';
import { SmoothScroll } from '@/components/animation/SmoothScroll';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { authMode } = useAuth();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <SmoothScroll>
      <div className="min-h-screen flex flex-col bg-[#08080a] text-[#f4f2ec] relative selection:bg-[#c5a880]/30 selection:text-[#f4f2ec]">
        <Header onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 pt-20">
          {authMode === 'demo' && (
            <aside 
              aria-label="Demo Mode Notice"
              className="bg-[#111116] border-b border-[#c5a880]/30 py-2 px-4 text-center text-xs font-mono-luxury text-[#e2c295] flex items-center justify-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#c5a880] animate-pulse" />
              <span>Atlas is currently operating in Demo Mode. Cloud authentication is temporarily unavailable.</span>
            </aside>
          )}
          {children}
        </main>
        <Footer />
        <QuickSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </SmoothScroll>
  );
};
