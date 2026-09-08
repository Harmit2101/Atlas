import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bookmark, Menu, X, User, LogIn, Compass } from 'lucide-react';
import { useSavedProperties } from '@/hooks/useSavedProperties';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { savedCount } = useSavedProperties();
  const { user } = useAuth();

  const navLinks = [
    { label: 'EXPLORE', path: '/explore' },
    { label: 'ABOUT', path: '/about' },
    { label: 'CONTACT', path: '/contact' }
  ];

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path;
  };

  const userInitial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'M';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#08080a]/85 backdrop-blur-md border-b border-white/[0.07] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Mark */}
          <Link to="/" className="flex items-center gap-3 group" data-cursor="ATLAS">
            <div className="w-8 h-8 rounded border border-[#c5a880]/60 flex items-center justify-center bg-[#111116] group-hover:border-[#c5a880] transition-colors">
              <span className="font-editorial text-lg text-[#c5a880] font-semibold">A</span>
            </div>
            <div className="flex flex-col">
              <span className="font-editorial text-xl tracking-[0.25em] text-[#f4f2ec] font-semibold">
                ATLAS
              </span>
              <span className="text-[8px] font-mono-luxury uppercase tracking-[0.3em] text-[#8e8d93] -mt-0.5">
                GLOBAL ASSETS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={`text-xs font-mono-luxury uppercase tracking-[0.2em] transition-all relative py-1 ${
                  isActive(link.path)
                    ? 'text-[#c5a880]'
                    : 'text-[#8e8d93] hover:text-[#f4f2ec]'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#c5a880]" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Quick Search Button */}
            <button
              onClick={onOpenSearch}
              aria-label="Search properties and destinations"
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#c5a880]/40 transition-all text-[#8e8d93] hover:text-[#f4f2ec]"
            >
              <Search className="w-3.5 h-3.5 text-[#c5a880]" />
              <span className="hidden sm:inline text-[11px] font-mono-luxury uppercase tracking-wider">
                SEARCH
              </span>
              <kbd className="hidden lg:inline text-[9px] font-mono-luxury bg-white/10 text-[#8e8d93] px-1 rounded">
                ⌘K
              </kbd>
            </button>

            {/* Saved Properties Link */}
            <Link
              to="/saved"
              aria-label="View saved properties"
              className="flex items-center gap-1.5 text-xs font-mono-luxury uppercase tracking-wider text-[#8e8d93] hover:text-[#f4f2ec] transition-colors relative"
            >
              <Bookmark className="w-4 h-4 text-[#c5a880]" />
              <span className="hidden sm:inline">SAVED</span>
              {savedCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold text-[#08080a] bg-[#c5a880] rounded-full">
                  {savedCount}
                </span>
              )}
            </Link>

            {/* Auth Button: Sign In or Account Profile */}
            {user ? (
              <Link
                to="/account"
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#111116] border border-[#c5a880]/40 hover:border-[#c5a880] text-xs font-mono-luxury text-[#f4f2ec] transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-[#c5a880] text-[#08080a] flex items-center justify-center font-bold text-[10px]">
                  {userInitial}
                </div>
                <span className="hidden sm:inline line-clamp-1 max-w-[90px]">{user.displayName}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-luxury uppercase tracking-widest text-[#f4f2ec] hover:text-[#c5a880] bg-white/[0.04] border border-white/10 hover:border-[#c5a880]/50 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-[#c5a880]" />
                <span>SIGN IN</span>
              </Link>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded text-[#8e8d93] hover:text-[#f4f2ec] hover:bg-white/5 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 pt-20 bg-[#08080a] md:hidden flex flex-col p-6 animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col space-y-6 mt-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-xl font-editorial tracking-wider transition-colors ${
                  isActive(link.path) ? 'text-[#c5a880]' : 'text-[#f4f2ec]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/saved"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xl font-editorial tracking-wider text-[#f4f2ec] flex items-center justify-between"
            >
              <span>SAVED ASSETS</span>
              <span className="text-xs font-mono-luxury text-[#c5a880]">({savedCount})</span>
            </Link>
            {user ? (
              <Link
                to="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xl font-editorial tracking-wider text-[#c5a880] flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                <span>ACCOUNT ({user.displayName})</span>
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xl font-editorial tracking-wider text-[#c5a880] flex items-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                <span>SIGN IN / REGISTER</span>
              </Link>
            )}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-6 space-y-4">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSearch();
              }}
              className="w-full py-3 px-4 rounded bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-xs font-mono-luxury uppercase tracking-widest text-[#f4f2ec]"
            >
              <Search className="w-4 h-4 text-[#c5a880]" />
              <span>Search Database</span>
            </button>

            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 px-4 rounded bg-[#c5a880] text-[#08080a] flex items-center justify-center gap-2 text-xs font-mono-luxury uppercase tracking-widest font-semibold"
            >
              <Compass className="w-4 h-4" />
              <span>Private Concierge Inquiry</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};
