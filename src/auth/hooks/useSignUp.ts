// src/auth/hooks/useSignUp.ts
import { useState } from 'react';
import { SignUpService } from '../services';
import { SignUpFormData, AuthError } from '../types';

export const useSignUp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const signUp = async (formData: SignUpFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await SignUpService.signUp(
        formData.email,
        formData.password,
        formData.fullName
      );
      
      if (!response.success) {
        setError(response.error || { message: 'Sign up failed' });
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data };
    } catch (err: any) {
      const error = { message: err.message || 'Sign up failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await SignUpService.signUpWithGoogle();
      
      if (!response.success) {
        setError(response.error || { message: 'Google sign up failed' });
        return { success: false, error: response.error };
      }

      return { success: true };
    } catch (err: any) {
      const error = { message: err.message || 'Google sign up failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    signUp,
    signUpWithGoogle,
    loading,
    error,
    clearError: () => setError(null)
  };
};
