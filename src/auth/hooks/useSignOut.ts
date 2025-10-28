// src/auth/hooks/useSignOut.ts
import { useState } from 'react';
import { SignOutService } from '../services';
import { AuthError } from '../types';

export const useSignOut = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const signOut = async (userEmail?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await SignOutService.signOut(userEmail);
      
      if (!response.success) {
        setError(response.error || { message: 'Sign out failed' });
        return { success: false, error: response.error };
      }

      return { success: true };
    } catch (err: any) {
      const error = { message: err.message || 'Sign out failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    signOut,
    loading,
    error,
    clearError: () => setError(null)
  };
};
