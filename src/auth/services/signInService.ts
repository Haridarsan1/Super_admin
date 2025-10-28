// src/auth/services/signInService.ts
import { supabase } from '../../lib/supabase';
import { AuthService } from './authService';
import { AuthResponse } from '../types';

export class SignInService {
  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔍 Checking if user exists in database with email:', email);
      
      // Check if user exists in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', email)
        .maybeSingle();

      if (profileError) {
        console.error('Profile lookup error:', profileError);
        if (profileError.message.includes('new row violates row-level security policy')) {
          return {
            success: false,
            error: { message: 'Database access denied' }
          };
        }
        return {
          success: false,
          error: { message: 'Database error occurred' }
        };
      }

      if (!profile) {
        console.log('❌ User not found in database:', email);
        return {
          success: false,
          error: { message: 'User is not registered' }
        };
      }

      console.log('✅ User found in database:', profile.email, 'Role:', profile.role);
      if (!['admin', 'superadmin'].includes(profile.role)) {
        console.log('❌ User lacks admin privileges:', profile.role);
        return {
          success: false,
          error: { message: 'Access denied. Admin privileges required.' }
        };
      }

      console.log('🔑 Attempting authentication for:', email);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Authentication error:', authError);
        if (authError.message.includes('Invalid login credentials')) {
          return {
            success: false,
            error: { message: 'Invalid password' }
          };
        }
        if ((authError as any).status === 429) {
          return {
            success: false,
            error: { message: 'Too many requests. Please try again later.' }
          };
        }
        return {
          success: false,
          error: { message: authError.message || 'Authentication failed' }
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: { message: 'Authentication failed - no user data returned' }
        };
      }

      if (authData.user.email !== profile.email) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: { message: 'Authentication verification failed' }
        };
      }

      const profileData = await AuthService.fetchProfile(authData.user.id);
      if (!profileData) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: { message: 'Profile load failed' }
        };
      }

      await AuthService.logActivity(authData.user.id, 'login', `Admin ${email} logged in successfully`);
      console.log('✅ Login successful for:', email);

      return {
        success: true,
        data: { user: authData.user, profile: profileData }
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Error cleaning up session:', signOutError);
      }
      return {
        success: false,
        error: { message: error.message || 'Sign in failed' }
      };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle(): Promise<AuthResponse> {
    try {
      const baseUrl = AuthService.getBaseUrl();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
        },
      });
      
      if (error) {
        return {
          success: false,
          error: { message: error.message || 'Google sign in failed' }
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      return {
        success: false,
        error: { message: error.message || 'Google sign in failed' }
      };
    }
  }
}
