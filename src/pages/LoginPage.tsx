import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to account or return location
  React.useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from || '/account';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else {
      const from = (location.state as any)?.from || '/account';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-[#111116] border border-[#c5a880]/40 p-8 sm:p-10 rounded-sm shadow-2xl space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded border border-[#c5a880]/60 flex items-center justify-center bg-[#08080a] mx-auto text-[#c5a880] font-editorial text-lg font-semibold">
            A
          </div>
          <span className="text-[10px] font-mono-luxury uppercase tracking-[0.3em] text-[#c5a880] block">
            ATLAS PRIVATE REGISTRY
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#f4f2ec]">
            Access Private Portfolio
          </h1>
          <p className="text-xs text-[#8e8d93] max-w-xs mx-auto font-light">
            Sign in to manage your saved acquisitions and confidential dossiers.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-950/40 border border-red-500/30 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
              Confidential Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="principal@familyoffice.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-3 pl-9 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
              />
              <Mail className="w-4 h-4 text-[#8e8d93] absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93]">
                Security Passkey
              </label>
              <Link to="/forgot-password" className="text-[10px] text-[#c5a880] hover:underline">
                Forgot passkey?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-3 pl-9 pr-9 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
              />
              <Lock className="w-4 h-4 text-[#8e8d93] absolute left-3 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-[#8e8d93] hover:text-[#f4f2ec]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-sm bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] font-mono-luxury text-xs uppercase tracking-widest font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'CONTINUE WITH ATLAS'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-white/[0.06] text-xs">
          <span className="text-[#8e8d93]">
            Do not possess an Atlas identifier?{' '}
            <Link to="/signup" className="text-[#c5a880] hover:underline font-medium">
              Create Registry Account
            </Link>
          </span>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono-luxury text-[#8e8d93]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#c5a880]" />
          <span>Encrypted Session with Supabase Security Protocols</span>
        </div>
      </div>
    </div>
  );
};
