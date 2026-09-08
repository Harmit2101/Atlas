import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Check, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { success, error: resetErr } = await resetPassword(email);
    if (!success && resetErr) {
      setError(resetErr);
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-[#111116] border border-[#c5a880]/40 p-8 sm:p-10 rounded-sm shadow-2xl space-y-8">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded border border-[#c5a880]/60 flex items-center justify-center bg-[#08080a] mx-auto text-[#c5a880] font-editorial text-lg font-semibold">
            A
          </div>
          <span className="text-[10px] font-mono-luxury uppercase tracking-[0.3em] text-[#c5a880] block">
            SECURITY RECOVERY
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#f4f2ec]">
            Recover Passkey
          </h1>
          <p className="text-xs text-[#8e8d93] max-w-xs mx-auto font-light">
            Enter your registered confidential email to receive instructions for security credential renewal.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-950/40 border border-red-500/30 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="py-8 text-center space-y-4 bg-white/[0.02] border border-[#c5a880]/40 rounded p-6">
            <div className="w-10 h-10 rounded-full bg-[#c5a880] text-[#08080a] flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-xl text-[#f4f2ec]">Instructions Transmitted</h3>
            <p className="text-xs text-[#8e8d93] leading-relaxed">
              If an account is associated with <span className="text-[#f4f2ec]">{email}</span>, encrypted reset instructions have been dispatched.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-mono-luxury uppercase text-[#c5a880] hover:underline pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-mono-luxury uppercase tracking-widest text-[#8e8d93] mb-1.5">
                Registered Email
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-sm bg-[#c5a880] hover:bg-[#e2c295] text-[#08080a] font-mono-luxury text-xs uppercase tracking-widest font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'TRANSMITTING...' : 'TRANSMIT RECOVERY LINK'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-4 border-t border-white/[0.06] text-xs">
          <Link to="/login" className="text-[#8e8d93] hover:text-[#f4f2ec] flex items-center justify-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono-luxury text-[#8e8d93]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#c5a880]" />
          <span>Encrypted Passkey Reset via Supabase Auth</span>
        </div>
      </div>
    </div>
  );
};
