// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { AuthContextType } from '../auth/types';
import { AuthService, SignInService, SignUpService, ResetPasswordService, SignOutService } from '../auth/services';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    return AuthService.fetchProfile(userId);
  };

  const logActivity = async (activityType: string, description: string): Promise<void> => {
    if (!user?.id) {
      console.warn('Cannot log activity: No user ID available');
      return;
    }

    await AuthService.logActivity(user.id, activityType, description);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', { event: _event, session }); // Added debug log
        try {
          setUser(session?.user ?? null);
          if (session?.user) {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          setProfile(null);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string): Promise<void> => {
    const response = await SignUpService.signUp(email, password, fullName);
    if (!response.success) {
      throw new Error(response.error?.message || 'Sign up failed');
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    const response = await SignInService.signIn(email, password);
    if (!response.success) {
      throw new Error(response.error?.message || 'Sign in failed');
    }
    if (response.data) {
      setProfile(response.data.profile);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    const response = await SignInService.signInWithGoogle();
    if (!response.success) {
      throw new Error(response.error?.message || 'Google sign in failed');
    }
  };

  const signOut = async (): Promise<void> => {
    const response = await SignOutService.signOut(user?.email);
    if (!response.success) {
      throw new Error(response.error?.message || 'Sign out failed');
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    const response = await ResetPasswordService.resetPassword(email);
    if (!response.success) {
      throw new Error(response.error?.message || 'Password reset failed');
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    logActivity,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Add debug log (optional, remove in production if not needed)
console.log('Resolved base URL:', AuthService.getBaseUrl());