import { supabase } from '../../lib/supabase';
import { AuthService } from './authService';
import { AuthResponse } from '../types';

export class ResetPasswordService {
  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const baseUrl = AuthService.getBaseUrl();
      console.log('Attempting password reset for:', email, '→', `${baseUrl}/reset-password`);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        return { success: false, error: { message: error.message || 'Password reset failed' } };
      }

      if (data) {
        console.log('Password reset email sent to:', email);
        // Optional: Log admin activity if session exists
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user?.id) {
            await supabase.from('admin_activity_logs').insert({
              admin_id: sessionData.session.user.id,
              activity_type: 'password_reset',
              description: `Password reset requested for: ${email}`,
              ip_address: '',
              user_agent: navigator.userAgent || '',
            });
          }
        } catch (logError) {
          console.warn('Skipping activity log (no session or RLS):', logError);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Password reset process error:', error);
      return { success: false, error: { message: error.message || 'Password reset failed' } };
    }
  }

  /**
   * Update user password (after session recovery)
   */
  static async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        console.error('Password update error:', error);
        if (error.message.includes('expired')) {
          return {
            success: false,
            error: { message: 'Password reset link has expired. Please request a new one.' },
          };
        } else {
          return {
            success: false,
            error: { message: error.message || 'Failed to update password' },
          };
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Password update exception:', error);
      return { success: false, error: { message: error.message || 'Failed to update password' } };
    }
  }

  /**
   * Verify and recover session from reset link
   */
  static async verifyResetToken(): Promise<AuthResponse> {
    try {
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));

      // Prioritize all parameters, with hash taking precedence for access_token and type
      const tokenHash = hashParams.get('token_hash') || searchParams.get('token_hash');
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      const type = hashParams.get('type') || searchParams.get('type');
      const code = searchParams.get('code');
      const token = searchParams.get('token'); // Handle the 'token' parameter seen in logs
      const email = searchParams.get('email') || undefined;

      // Attempt to get email from session or local storage if not in URL
      let sessionEmail: string | undefined;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        sessionEmail = session?.user?.email;
      } catch (err) {
        console.warn('Could not fetch session email:', err);
        sessionEmail = localStorage.getItem('resetEmail');
      }

      console.log('Verifying token with params:', { tokenHash, accessToken, type, code, token, email, refreshToken, sessionEmail });

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        window.history.replaceState({}, document.title, '/reset-password');
        return { success: true };
      }

      if (token && (email || sessionEmail)) {
        const { error } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token,
          email: email || sessionEmail,
        });
        if (error) throw error;
        window.history.replaceState({}, document.title, '/reset-password');
        return { success: true };
      }

      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: tokenHash,
        });
        if (error) throw error;
        window.history.replaceState({}, document.title, '/reset-password');
        return { success: true };
      }

      if (type === 'recovery' && accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw error;
        window.history.replaceState({}, document.title, '/reset-password');
        return { success: true };
      }

      // Fallback: Attempt to recover session directly with the token
      if (token && !email && !sessionEmail) {
        console.warn('Attempting session recovery with token only:', token);
        const { error, data } = await supabase.auth.recoverSession(token);
        if (error) {
          console.error('Session recovery failed:', error);
          throw error;
        }
        if (data.session) {
          window.history.replaceState({}, document.title, '/reset-password');
          return { success: true };
        }
      }

      return {
        success: false,
        error: { message: 'Invalid reset link. Please request a new password reset.' },
      };
    } catch (error: any) {
      console.error('Session recovery error:', error);
      return {
        success: false,
        error: { message: 'Invalid or expired reset link. Please request a new password reset.' },
      };
    }
  }
}