// src/auth/components/SignUpForm.tsx
import { useState } from 'react';
import { useSignUp } from '../hooks';
import { Mail, Lock, User, Chrome } from 'lucide-react';
import { SignUpFormData } from '../types';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
  onSwitchToResetPassword: () => void;
}

export default function SignUpForm({ onSwitchToLogin, onSwitchToResetPassword }: SignUpFormProps) {
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    fullName: ''
  });

  const { signUp, signUpWithGoogle, loading, error, clearError } = useSignUp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await signUp(formData);
    } catch (err: any) {
      console.error('Sign up error:', err);
    }
  };

  const handleGoogleSignUp = async () => {
    clearError();

    try {
      await signUpWithGoogle();
    } catch (err: any) {
      console.error('Google sign up error:', err);
    }
  };

  const handleInputChange = (field: keyof SignUpFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg text-sm">
          {error.message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="full-name" className="sr-only">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              id="full-name"
              type="text"
              required
              value={formData.fullName}
              onChange={handleInputChange('fullName')}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Full Name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="sr-only">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange('email')}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email address"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange('password')}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Password (min. 6 characters)"
              minLength={6}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating Account...' : 'Sign Up'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-slate-800 text-slate-300">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={loading}
        className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Chrome className="w-5 h-5" />
        Sign up with Google
      </button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onSwitchToResetPassword}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-slate-300 hover:text-white transition-colors"
        >
          Already have an account? <span className="text-blue-400">Sign in</span>
        </button>
      </div>
    </form>
  );
}
