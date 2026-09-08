import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Bookmark, LogOut, ShieldCheck, ArrowRight, Compass } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSavedProperties } from '@/hooks/useSavedProperties';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { savedCount } = useSavedProperties();

  React.useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : 'M';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6 space-y-2">
        <span className="text-[10px] font-mono-luxury uppercase tracking-[0.25em] text-[#c5a880]">
          ATLAS MEMBER REGISTRY
        </span>
        <h1 className="font-editorial text-4xl sm:text-5xl text-[#f4f2ec]">
          Account & Private Portfolio
        </h1>
      </div>

      {/* Profile Card */}
      <div className="bg-[#111116] border border-white/[0.08] p-8 rounded-sm space-y-8">
        {/* User Identity */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#08080a] border border-[#c5a880]/60 flex items-center justify-center font-editorial text-2xl text-[#c5a880] font-semibold">
            {initial}
          </div>
          <div>
            <h2 className="font-editorial text-2xl text-[#f4f2ec]">{user.displayName}</h2>
            <div className="flex items-center gap-1.5 text-xs text-[#8e8d93] mt-0.5">
              <Mail className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono-luxury text-[#c5a880] uppercase tracking-wider mt-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified Atlas Sovereign Access</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
          <Link
            to="/saved"
            className="p-5 rounded bg-white/[0.02] border border-white/[0.06] hover:border-[#c5a880]/40 transition-colors group flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono-luxury uppercase text-[#8e8d93]">
                <Bookmark className="w-3.5 h-3.5 text-[#c5a880]" />
                <span>Saved Portfolio</span>
              </div>
              <div className="font-editorial text-3xl text-[#f4f2ec]">{savedCount} Assets</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8e8d93] group-hover:text-[#c5a880] transition-colors" />
          </Link>

          <Link
            to="/explore"
            className="p-5 rounded bg-white/[0.02] border border-white/[0.06] hover:border-[#c5a880]/40 transition-colors group flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono-luxury uppercase text-[#8e8d93]">
                <Compass className="w-3.5 h-3.5 text-[#c5a880]" />
                <span>Global Market Hubs</span>
              </div>
              <div className="font-editorial text-3xl text-[#c5a880]">Active Discovery</div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#8e8d93] group-hover:text-[#c5a880] transition-colors" />
          </Link>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <Link
            to="/saved"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#c5a880] text-[#08080a] text-xs font-mono-luxury uppercase tracking-widest font-semibold hover:bg-[#e2c295] transition-colors"
          >
            <span>View Saved Portfolio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-transparent border border-white/10 hover:border-red-500/40 text-xs font-mono-luxury uppercase tracking-wider text-[#8e8d93] hover:text-red-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
