import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  propertyTitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  propertyTitle
}) => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await signUp(email, password, displayName);
        if (signUpError) {
          setError(signUpError);
          setLoading(false);
          return;
        }
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError);
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08080a]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#111116] border border-[#c5a880]/40 rounded-sm shadow-2xl p-8 relative space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded text-[#8e8d93] hover:text-[#f4f2ec] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand & Heading */}
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded border border-[#c5a880]/60 flex items-center justify-center bg-[#08080a] mx-auto text-[#c5a880] font-editorial text-base font-semibold">
            A
          </div>
          <span className="text-[9px] font-mono-luxury uppercase tracking-[0.3em] text-[#c5a880] block">
            ATLAS PRIVATE REGISTRY
          </span>
          <h3 className="font-editorial text-2xl sm:text-3xl text-[#f4f2ec]">
            {isSignUp ? 'Establish Portfolio' : 'Your Private Collection'}
          </h3>
          {propertyTitle && (
            <p className="text-[11px] text-[#8e8d93] max-w-xs mx-auto line-clamp-1">
              Sign in to save <span className="text-[#f4f2ec]">"{propertyTitle}"</span>
            </p>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded bg-red-950/40 border border-red-500/30 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isSignUp && (
            <div>
              <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
                Full Name / Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Lord / Lady / Principal..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2.5 pl-9 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
                />
                <User className="w-3.5 h-3.5 text-[#8e8d93] absolute left-3 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
              Confidential Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="principal@familyoffice.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2.5 pl-9 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
              />
              <Mail className="w-3.5 h-3.5 text-[#8e8d93] absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1">
              Security Passkey
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#08080a] border border-white/10 rounded px-3 py-2.5 pl-9 pr-9 text-[#f4f2ec] focus:border-[#c5a880] outline-none"
              />
              <Lock className="w-3.5 h-3.5 text-[#8e8d93] absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#8e8d93] hover:text-[#f4f2ec]"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-sm bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] font-mono-luxury text-xs uppercase tracking-widest font-semibold transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'AUTHENTICATING...' : isSignUp ? 'CREATE ATLAS ACCOUNT' : 'CONTINUE WITH ATLAS'}
          </button>
        </form>

        {/* Toggle between Sign In and Sign Up */}
        <div className="text-center pt-2 border-t border-white/[0.06] text-xs">
          {isSignUp ? (
            <span className="text-[#8e8d93]">
              Already registered?{' '}
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                }}
                className="text-[#c5a880] hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span className="text-[#8e8d93]">
              New to Atlas?{' '}
              <button
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                }}
                className="text-[#c5a880] hover:underline"
              >
                Create Account
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono-luxury text-[#8e8d93]">
          <ShieldCheck className="w-3 h-3 text-[#c5a880]" />
          <span>Encrypted with Supabase Auth Protocols</span>
        </div>
      </div>
    </div>
  );
};
