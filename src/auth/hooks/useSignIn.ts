// src/auth/hooks/useSignIn.ts
import { useState } from 'react';
import { SignInService } from '../services';
import { LoginFormData, AuthError } from '../types';

export const useSignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const signIn = async (formData: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await SignInService.signIn(formData.email, formData.password);
      
      if (!response.success) {
        setError(response.error || { message: 'Sign in failed' });
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data };
    } catch (err: any) {
      const error = { message: err.message || 'Sign in failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await SignInService.signInWithGoogle();
      
      if (!response.success) {
        setError(response.error || { message: 'Google sign in failed' });
        return { success: false, error: response.error };
      }

      return { success: true };
    } catch (err: any) {
      const error = { message: err.message || 'Google sign in failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    signIn,
    signInWithGoogle,
    loading,
    error,
    clearError: () => setError(null)
  };
};
