import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'dealer' | 'admin' | 'private-client';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Prevent flashing protected content while auth state resolves
  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-4 bg-[#08080a]">
        <div className="w-10 h-10 rounded border border-[#c5a880]/60 flex items-center justify-center bg-[#111116] animate-pulse">
          <span className="font-editorial text-lg text-[#c5a880] font-semibold">A</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono-luxury uppercase tracking-widest text-[#8e8d93]">
          <Loader2 className="w-3.5 h-3.5 text-[#c5a880] animate-spin" />
          <span>Verifying Registry Clearance...</span>
        </div>
      </div>
    );
  }

  // Not authenticated: preserve intended destination and redirect to login
  if (!user) {
    const returnPath = location.pathname + location.search;
    return (
      <Navigate 
        to={`/login?redirect=${encodeURIComponent(returnPath)}`} 
        state={{ from: returnPath }} 
        replace 
      />
    );
  }

  // Role checks
  if (requiredRole === 'dealer') {
    const isDealerOrAdmin = user.role === 'dealer' || user.role === 'admin' || Boolean(user.isDemo && user.email.toLowerCase() === 'dealer@atlas.luxury');
    if (!isDealerOrAdmin) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md bg-[#111116] border border-red-500/30 p-8 rounded-sm shadow-2xl text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-mono-luxury uppercase tracking-[0.25em] text-red-400 block">
                Clearance Required
              </span>
              <h2 className="font-editorial text-2xl text-[#f4f2ec]">
                Commercial Dealer Workspace
              </h2>
              <p className="text-xs text-[#8e8d93] leading-relaxed">
                Your account ({user.email}) is authenticated as a private client ({user.role || 'buyer'}). Access to broker listings, desk claims, and conversion analytics requires an active Dealer affiliation.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/explore"
                className="w-full py-2.5 rounded-sm bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] font-mono-luxury text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Discovery</span>
              </Link>
              <Link
                to="/contact"
                className="w-full py-2.5 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 text-[#f4f2ec] font-mono-luxury text-xs uppercase tracking-wider transition-colors"
              >
                Request Dealer Verification
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  if (requiredRole === 'admin') {
    const isAdmin = user.role === 'admin' || Boolean(user.isDemo && user.email.toLowerCase() === 'admin@atlas.luxury');
    if (!isAdmin) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md bg-[#111116] border border-red-500/30 p-8 rounded-sm shadow-2xl text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-mono-luxury uppercase tracking-[0.25em] text-red-400 block">
                Executive Access Only
              </span>
              <h2 className="font-editorial text-2xl text-[#f4f2ec]">
                Lead Desk Clearance Required
              </h2>
              <p className="text-xs text-[#8e8d93] leading-relaxed">
                The Executive Inquiries Lead Desk is restricted to Atlas platform administrators.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/explore"
                className="w-full py-2.5 rounded-sm bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] font-mono-luxury text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Global Discovery</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
