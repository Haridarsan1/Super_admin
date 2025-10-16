// src/components/AuthPage.tsx
import { useState } from 'react';
import { LoginForm, SignUpForm, ResetPasswordForm } from '../auth';

export default function AuthPage() {
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'reset'>('login');

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginForm
            onSwitchToSignUp={() => setCurrentView('signup')}
            onSwitchToResetPassword={() => setCurrentView('reset')}
          />
        );
      case 'signup':
        return (
          <SignUpForm
            onSwitchToLogin={() => setCurrentView('login')}
            onSwitchToResetPassword={() => setCurrentView('reset')}
          />
        );
      case 'reset':
        return (
          <ResetPasswordForm
            onBack={() => setCurrentView('login')}
          />
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case 'login':
        return {
          title: 'Welcome Back',
          subtitle: 'Sign in to access your dashboard'
        };
      case 'signup':
        return {
          title: 'Create Account',
          subtitle: 'Join our admin platform today'
        };
      case 'reset':
        return {
          title: 'Reset Password',
          subtitle: 'Enter your email to receive a password reset link'
        };
      default:
        return {
          title: 'Welcome',
          subtitle: 'Please sign in or create an account'
        };
    }
  };

  const { title, subtitle } = getTitle();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
        <div>
          <h2 className="text-3xl font-bold text-white text-center">{title}</h2>
          <p className="mt-2 text-sm text-slate-300 text-center">
            {subtitle}
          </p>
        </div>
        {renderCurrentView()}
      </div>
    </div>
  );
}
