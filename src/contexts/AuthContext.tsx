import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logActivity: (activityType: string, description: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data || null;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const logActivity = async (activityType: string, description: string): Promise<void> => {
    if (!user?.id) {
      console.warn('Cannot log activity: No user ID available');
      return;
    }

    try {
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: user.id,
          activity_type: activityType,
          description,
          ip_address: '',
          user_agent: navigator.userAgent || '',
        });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Initial session load
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

  // Auth state subscription
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        throw new Error(error.message || 'Sign up failed');
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            role: 'admin',
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error('Profile creation failed');
        }

        await logActivity('action', `New admin account created: ${email}`);
      }
    } catch (error: any) {
      console.error('Sign up process error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      // Step 1: Check if user exists in profiles table BEFORE authentication
      console.log('🔍 Checking if user exists in database with email:', email);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', email)
        .maybeSingle();

      if (profileError) {
        console.error('Profile lookup error:', profileError);
        if (profileError.message.includes('new row violates row-level security policy') || 
            profileError.code === '42501') {
          throw new Error('Database access denied');
        }
        throw new Error('Database error occurred');
      }

      if (!profile) {
        console.log('❌ User not found in database:', email);
        throw new Error('User is not registered');
      }

      console.log('✅ User found in database:', profile.email, 'Role:', profile.role);

      // Step 2: Check if user has admin privileges
      if (!['admin', 'superadmin'].includes(profile.role)) {
        console.log('❌ User lacks admin privileges:', profile.role);
        throw new Error('Access denied. Admin privileges required.');
      }

      // Step 3: Now attempt authentication with password
      console.log('🔑 Attempting authentication for:', email);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Authentication error:', authError);
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid password');
        }
        if (authError.statusCode === 429) {
          throw new Error('Too many requests. Please try again later.');
        }
        throw new Error(authError.message || 'Authentication failed');
      }

      if (!authData.user) {
        throw new Error('Authentication failed - no user data returned');
      }

      // Step 4: Verify the authenticated user matches the profile
      if (authData.user.email !== profile.email) {
        console.error('Email mismatch between auth and profile');
        await supabase.auth.signOut();
        throw new Error('Authentication verification failed');
      }

      // Step 5: Fetch complete profile and set state
      const profileData = await fetchProfile(authData.user.id);
      
      if (!profileData) {
        console.error('Complete profile fetch failed after auth');
        await supabase.auth.signOut();
        throw new Error('Profile load failed');
      }

      setProfile(profileData);
      await logActivity('login', `Admin ${email} logged in successfully`);
      
      console.log('✅ Login successful for:', email);
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Clean up any partial authentication session
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Error cleaning up session:', signOutError);
      }
      
      throw new Error(error.message || 'Sign in failed');
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Google sign in error:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      throw new Error(error.message || 'Google sign in failed');
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await logActivity('logout', `Admin ${user?.email || 'unknown'} logged out`);
      await supabase.auth.signOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Critical sign out error:', signOutError);
        throw new Error('Sign out failed');
      }
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }

      await logActivity('password_reset', `Password reset requested for: ${email}`);
    } catch (error: any) {
      console.error('Password reset process error:', error);
      throw new Error(error.message || 'Password reset failed');
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