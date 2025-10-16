// src/auth/components/ResetPasswordForm.tsx
import { useState } from 'react';
import { useResetPassword } from '../hooks';
import { Mail } from 'lucide-react';
import { ResetPasswordFormData } from '../types';

interface ResetPasswordFormProps {
  onBack: () => void;
}

export default function ResetPasswordForm({ onBack }: ResetPasswordFormProps) {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    email: ''
  });
  const [success, setSuccess] = useState(false);

  const { resetPassword, loading, error, clearError } = useResetPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccess(false);

    if (!formData.email) {
      return;
    }

    try {
      const result = await resetPassword(formData);
      if (result.success) {
        setSuccess(true);
        setFormData({ email: '' });
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      email: e.target.value
    });
  };

  if (success) {
    return (
      <div className="mt-4 space-y-4">
        <div className="bg-green-500/20 border border-green-500/50 text-green-100 px-4 py-3 rounded-lg text-sm text-center">
          Password reset email sent! Check your inbox and follow the link to reset your password.
        </div>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            clearError();
          }}
          className="w-full text-sm text-slate-300 hover:text-white transition-colors"
        >
          Send another reset email
        </button>
        <button
          type="button"
          onClick={onBack}
          className="w-full text-sm text-slate-300 hover:text-white transition-colors"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg text-sm text-center">
          {error.message}
        </div>
      )}
      
      <div>
        <label htmlFor="reset-email" className="sr-only">Email address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            id="reset-email"
            type="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
      
      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-slate-300 hover:text-white transition-colors"
      >
        Back to Login
      </button>
    </form>
  );
}
