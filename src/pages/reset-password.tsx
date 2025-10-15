// src/pages/reset-password.tsx
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
  const [accessToken, setAccessToken] = useState('');
  const { logActivity } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenHash = urlParams.get('token_hash');
    const type = urlParams.get('type');
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessTokenFromHash = hashParams.get('access_token');
    const errorParam = hashParams.get('error');
    const errorDescription = hashParams.get('error_description');

    console.log('URL Parameters:', { tokenHash, accessTokenFromHash, type, error: errorParam, errorDescription });

    if ((tokenHash || accessTokenFromHash) && type === 'recovery') {
      console.log('Processing token:', tokenHash || accessTokenFromHash);
      setAccessToken(tokenHash || accessTokenFromHash);
    } else if (errorParam || errorDescription) {
      setError(errorDescription || 'Invalid reset link. Please request a new password reset.');
    } else {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!accessToken) {
      setError('No valid reset token found. Please use the link from your email.');
      setLoading(false);
      return;
    }

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
      console.log('Attempting to update password with token:', accessToken);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      }, {
        token: accessToken,
      });

      if (error) {
        console.error('Password update error:', error);
        if (error.message.includes('Token has expired')) {
          setError('Password reset link has expired. Please request a new one.');
        } else if (error.message.includes('Invalid token')) {
          setError('Invalid password reset link. Please request a new one.');
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

  if (!accessToken && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
        <div>
          <h2 className="text-3xl font-bold text-white text-center">Reset Password</h2>
          <p className="mt-2 text-sm text-slate-300 text-center">
            Enter your new password
          </p>
        </div>
        
        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg">{error}</div>}
        {success && <div className="bg-green-500/20 border border-green-500/50 text-green-100 px-4 py-3 rounded-lg">{success}</div>}

        <form onSubmit={handlePasswordReset} className="mt-8 space-y-6">
          <div>
            <label htmlFor="newPassword" className="sr-only">New Password</label>
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
            <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
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