// src/auth/services/signOutService.ts
import { supabase } from '../../lib/supabase';
import { AuthService } from './authService';
import { AuthResponse } from '../types';

export class SignOutService {
  /**
   * Sign out user
   */
  static async signOut(userEmail?: string): Promise<AuthResponse> {
    try {
      // Log activity before signing out
      if (userEmail) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user?.id) {
            await AuthService.logActivity(
              sessionData.session.user.id,
              'logout',
              `Admin ${userEmail} logged out`
            );
          }
        } catch (logError) {
          console.error('Error logging logout activity:', logError);
          // Don't fail signout if logging fails
        }
      }

      await supabase.auth.signOut();
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Critical sign out error:', signOutError);
        return {
          success: false,
          error: { message: 'Sign out failed' }
        };
      }
      return { success: true };
    }
  }
}
