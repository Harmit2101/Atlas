import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@/types/user';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser, 
  resetPasswordEmail,
  getLocalUser 
} from '@/services/authService';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase.auth.getSession();
          if (mounted) {
            if (data.session?.user) {
              setUser({
                id: data.session.user.id,
                email: data.session.user.email || '',
                displayName: data.session.user.user_metadata?.display_name || data.session.user.email?.split('@')[0] || 'Member',
                avatarUrl: data.session.user.user_metadata?.avatar_url,
                createdAt: data.session.user.created_at
              });
            } else {
              setUser(null);
            }
          }
        } catch (e) {
          console.warn('[ATLAS] Supabase auth session check failed:', e);
          if (mounted) setUser(getLocalUser());
        }
      } else {
        if (mounted) setUser(getLocalUser());
      }
      if (mounted) setLoading(false);
    }

    initializeAuth();

    // Subscribe to Supabase auth state changes if configured
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Member',
            avatarUrl: session.user.user_metadata?.avatar_url,
            createdAt: session.user.created_at
          });
        } else {
          setUser(null);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user: loggedInUser, error } = await signInWithEmail(email, password);
    if (!error && loggedInUser) {
      setUser(loggedInUser);
    }
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { user: newUser, error } = await signUpWithEmail(email, password, displayName);
    if (!error && newUser) {
      setUser(newUser);
    }
    return { error };
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
