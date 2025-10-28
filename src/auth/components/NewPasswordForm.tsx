import { useState, useEffect } from 'react';
import { useResetPassword } from '../hooks';
import { Lock } from 'lucide-react';
import { NewPasswordFormData } from '../types';

export default function NewPasswordForm() {
  const [formData, setFormData] = useState<NewPasswordFormData>({
    newPassword: '',
    confirmPassword: ''
  });
  const [success, setSuccess] = useState(false);

  const { updatePassword, verifyResetToken, loading, error, clearError } = useResetPassword();

  // Verify reset token on component mount
  useEffect(() => {
    const handleTokenVerification = async () => {
      try {
        const result = await verifyResetToken();
        if (!result.success) {
          console.error('Token verification failed:', result.error);
        }
      } catch (err) {
        console.error('Token verification error:', err);
      }
    };

    handleTokenVerification();
  }, [verifyResetToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccess(false);

    try {
      const result = await updatePassword(formData);
      if (result.success) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (err: any) {
      console.error('Password update error:', err);
    }
  };

  const handleInputChange = (field: keyof NewPasswordFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const isFormValid = formData.newPassword === formData.confirmPassword && 
                     formData.newPassword.length >= 6;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Error</h2>
            <p className="mt-2 text-red-100">{error.message}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-500/20 border border-green-500/50 text-green-100 px-4 py-3 rounded-lg text-center">
        Password updated successfully! Redirecting to login...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
        <div>
          <h2 className="text-3xl font-bold text-white text-center">Reset Password</h2>
          <p className="mt-2 text-sm text-slate-300 text-center">Enter your new password</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={formData.newPassword}
                onChange={handleInputChange('newPassword')}
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
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
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