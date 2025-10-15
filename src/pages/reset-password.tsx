'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { logActivity } = useAuth();

  // ✅ Load token from URL and set Supabase session (supports #access_token and ?code)
  useEffect(() => {
    const handleRecovery = async () => {
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      const storedEmail = (() => { try { return localStorage.getItem('resetEmail') || undefined; } catch { return undefined; } })();

      const code = searchParams.get('code');
      const token = searchParams.get('token');
      const email = searchParams.get('email') || storedEmail || undefined;
      const tokenHash = searchParams.get('token_hash');
      const type = hashParams.get('type') || searchParams.get('type');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      console.log('Reset URL params:', { code, token, email, tokenHash, accessToken, refreshToken, type });

      try {
        if (code) {
          // Newer flow: exchange code for a session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.history.replaceState({}, document.title, '/reset-password');
          return;
        }

        if (token && email) {
          // OTP token flow: verify with token + email
          const { error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token,
            email,
          });
          if (error) throw error;
          window.history.replaceState({}, document.title, '/reset-password');
          return;
        }

        if (tokenHash) {
          // Token-hash flow: verify OTP for recovery
          const { error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: tokenHash,
          });
          if (error) throw error;
          window.history.replaceState({}, document.title, '/reset-password');
          return;
        }

        if (type === 'recovery' && accessToken && refreshToken) {
          // Legacy/hash flow: set session from tokens
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          window.history.replaceState({}, document.title, '/reset-password');
          return;
        }

        setError('Invalid reset link. Please request a new password reset.');
      } catch (err) {
        console.error('Session error:', err);
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };

    handleRecovery();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // ✅ Update password for the currently active session
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        console.error('Password update error:', error);
        if (error.message.includes('expired')) {
          setError('Password reset link has expired. Please request a new one.');
        } else {
          setError(error.message || 'Failed to update password');
        }
        return;
      }

      setSuccess('Password updated successfully! Redirecting to login...');
      await logActivity('password_reset', 'Password successfully reset');

      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
        <div>
          <h2 className="text-3xl font-bold text-white text-center">Reset Password</h2>
          <p className="mt-2 text-sm text-slate-300 text-center">Enter your new password</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-100 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="mt-8 space-y-6">
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="New password"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>

          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            className="w-full text-sm text-slate-300 hover:text-white transition-colors"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
