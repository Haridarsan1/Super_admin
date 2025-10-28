// src/auth/services/signUpService.ts
import { supabase } from '../../lib/supabase';
import { AuthService } from './authService';
import { AuthResponse } from '../types';

export class SignUpService {
  /**
   * Sign up with email, password, and full name
   */
  static async signUp(email: string, password: string, fullName: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) {
        return {
          success: false,
          error: { message: error.message || 'Sign up failed' }
        };
      }

      if (data.user) {
        // Create profile in database
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role: 'admin',
        });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          return {
            success: false,
            error: { message: 'Failed to create user profile' }
          };
        }

        // Log activity if possible
        try {
          await AuthService.logActivity(data.user.id, 'action', `New admin account created: ${email}`);
        } catch (logError) {
          console.error('Error logging signup activity:', logError);
          // Don't fail signup if logging fails
        }
      }

      return {
        success: true,
        data: { user: data.user }
      };
    } catch (error: any) {
      console.error('Sign up process error:', error);
      return {
        success: false,
        error: { message: error.message || 'Sign up failed' }
      };
    }
  }

  /**
   * Sign up with Google OAuth
   */
  static async signUpWithGoogle(): Promise<AuthResponse> {
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
          error: { message: error.message || 'Google sign up failed' }
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      return {
        success: false,
        error: { message: error.message || 'Google sign up failed' }
      };
    }
  }
}
