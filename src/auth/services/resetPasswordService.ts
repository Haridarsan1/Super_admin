import { supabase } from '../../lib/supabase';
import { AuthService } from './authService';
import { AuthResponse } from '../types';

export class ResetPasswordService {
  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<AuthResponse> {
    try {
      // Prefer the real current origin in-browser to avoid mismatch with Supabase auth redirect config.
      const inBrowserOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : undefined;
      const baseUrl = inBrowserOrigin || AuthService.getBaseUrl();
      const redirectTo = `${baseUrl.replace(/\/$/, '')}/reset-password`;

      console.log('Attempting password reset for:', email, '→', redirectTo);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        // `redirectTo` must exactly match an allowed URL in Supabase Dashboard > Auth > Settings > Redirect URLs
        redirectTo,
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
      // Parse URL params and hash (Supabase sometimes returns tokens in the hash)
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));

      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      const type = hashParams.get('type') || searchParams.get('type');
      const code = searchParams.get('code');
      const token = searchParams.get('token') || hashParams.get('token');
      const email = searchParams.get('email') || hashParams.get('email') || undefined;

      console.debug('verifyResetToken params:', { accessToken, refreshToken, type, code, token, email });

      // 1) OAuth-style code exchange (rare for password resets, handles some flows)
      if (code) {
        console.debug('Exchanging code for session...');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        window.history.replaceState({}, document.title, '/reset-password');
        return { success: true };
      }

      // 2) Typical Supabase v2 recovery flow: type=recovery + tokens in hash
      if (type === 'recovery' && accessToken && refreshToken) {
        console.debug('Setting session from recovery tokens...');
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) {
          console.error('setSession failed:', error);
          throw error;
        }
        // Clean tokens from URL for UX
        window.history.replaceState({}, document.title, '/reset-password');
        return { success: true };
      }

      // 3) Legacy flows: token + email -> verifyOtp (recovery)
      if (token && email) {
        console.debug('Verifying OTP recovery token with email...');
        const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token, email });
        if (error) {
          console.error('verifyOtp failed:', error);
          throw error;
        }
        window.history.replaceState({}, document.title, '/reset-password');
        return { success: true };
      }

      // If none of the supported patterns matched, return an explicit message
      console.warn('No valid recovery parameters found in URL. Ensure redirect URL matches Supabase settings and that the reset link has not expired.');
      return {
        success: false,
        error: {
          message:
            'Invalid reset link. Ensure you used the latest link sent to your email, and that the redirect URL is registered in Supabase Auth settings (e.g. https://your-app.example.com/reset-password or http://localhost:5731/reset-password for local).' 
        },
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