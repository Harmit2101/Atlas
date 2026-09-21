import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, AuthMode } from '@/types/user';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser, 
  resetPasswordEmail,
  getLocalUser,
  getCloudAvailability,
  setCloudAvailability,
  probeCloudHealth,
  CloudHealthState
} from '@/services/authService';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  authMode: AuthMode;
  isCloudAvailable: boolean;
  cloudHealth: CloudHealthState;
  signIn: (email: string, password: string) => Promise<{ error: string | null; mode?: AuthMode }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null; mode?: AuthMode }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloudHealth, setCloudHealth] = useState<CloudHealthState>(() => {
    if (!isSupabaseConfigured) return 'CLOUD_UNAVAILABLE';
    return getCloudAvailability() ? 'CLOUD_AVAILABLE' : 'CLOUD_UNAVAILABLE';
  });
  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    return isSupabaseConfigured && getCloudAvailability() ? 'cloud' : 'demo';
  });

  const initializeAuth = useCallback(async () => {
    let activeUser: UserProfile | null = null;
    let mode: AuthMode = 'demo';

    if (isSupabaseConfigured) {
      setCloudHealth('CLOUD_CHECKING');
      try {
        // Active probe to ensure we don't stay locked in demo mode once cloud recovers
        const isHealthy = await probeCloudHealth();

        if (isHealthy) {
          setCloudHealth('CLOUD_AVAILABLE');
          setCloudAvailability(true);
          mode = 'cloud';

          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            let role: any = 'buyer';
            let buyerStatus: any = 'verified';
            let displayName = data.session.user.user_metadata?.display_name || data.session.user.email?.split('@')[0] || 'Member';
            let avatarUrl = data.session.user.user_metadata?.avatar_url;

            try {
              const { data: prof } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url')
                .eq('id', data.session.user.id)
                .maybeSingle();
              if (prof) {
                if (prof.display_name) displayName = prof.display_name;
                if (prof.avatar_url) avatarUrl = prof.avatar_url;
              }
            } catch {}

            activeUser = {
              id: data.session.user.id,
              email: data.session.user.email || '',
              displayName,
              avatarUrl,
              role,
              buyerStatus,
              createdAt: data.session.user.created_at,
              isDemo: false
            };
          } else {
            activeUser = null;
          }
        } else {
          setCloudHealth('CLOUD_UNAVAILABLE');
          setCloudAvailability(false);
          activeUser = getLocalUser();
          mode = 'demo';
        }
      } catch (e: any) {
        setCloudHealth('CLOUD_UNAVAILABLE');
        setCloudAvailability(false);
        activeUser = getLocalUser();
        mode = 'demo';
      }
    } else {
      setCloudHealth('CLOUD_UNAVAILABLE');
      activeUser = getLocalUser();
      mode = 'demo';
    }

    // If in demo mode and no active user loaded, read local fallback
    if (mode === 'demo' && !activeUser) {
      activeUser = getLocalUser();
    }

    setUser(activeUser);
    setAuthMode(mode);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    initializeAuth();

    // Subscribe to Supabase auth state changes if configured and cloud available
    if (isSupabaseConfigured && getCloudAvailability()) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!mounted) return;
          if (session?.user) {
            let role: any = 'buyer';
            let buyerStatus: any = 'verified';
            let displayName = session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Member';
            let avatarUrl = session.user.user_metadata?.avatar_url;

            try {
              const { data: prof } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url')
                .eq('id', session.user.id)
                .maybeSingle();
              if (prof) {
                if (prof.display_name) displayName = prof.display_name;
                if (prof.avatar_url) avatarUrl = prof.avatar_url;
              }
            } catch {}

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              displayName,
              avatarUrl,
              role,
              buyerStatus,
              createdAt: session.user.created_at,
              isDemo: false
            });
            setAuthMode('cloud');
          } else {
            // Only clear user if not already in local demo mode
            setUser(prev => (prev?.isDemo ? prev : null));
          }
        });

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch {}
    }

    return () => {
      mounted = false;
    };
  }, [initializeAuth]);

  const signIn = async (email: string, password: string) => {
    const { user: loggedInUser, error, mode } = await signInWithEmail(email, password);
    if (!error && loggedInUser) {
      setUser(loggedInUser);
      const effectiveMode = mode || (loggedInUser.isDemo ? 'demo' : 'cloud');
      setAuthMode(effectiveMode);
      if (effectiveMode === 'cloud') {
        setCloudHealth('CLOUD_AVAILABLE');
        setCloudAvailability(true);
      }
    }
    return { error, mode };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { user: newUser, error, mode } = await signUpWithEmail(email, password, displayName);
    if (!error && newUser) {
      setUser(newUser);
      const effectiveMode = mode || (newUser.isDemo ? 'demo' : 'cloud');
      setAuthMode(effectiveMode);
      if (effectiveMode === 'cloud') {
        setCloudHealth('CLOUD_AVAILABLE');
        setCloudAvailability(true);
      }
    }
    return { error, mode };
  };

  const signOut = async () => {
    await signOutUser();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    return resetPasswordEmail(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isSupabaseConfigured,
        authMode,
        isCloudAvailable: cloudHealth === 'CLOUD_AVAILABLE' || getCloudAvailability(),
        cloudHealth,
        signIn,
        signUp,
        signOut,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
