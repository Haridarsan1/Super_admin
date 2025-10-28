// src/auth/hooks/useResetPassword.ts
import { useState } from 'react';
import { ResetPasswordService } from '../services';
import { ResetPasswordFormData, NewPasswordFormData, AuthError } from '../types';

export const useResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const resetPassword = async (formData: ResetPasswordFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await ResetPasswordService.resetPassword(formData.email);
      
      if (!response.success) {
        setError(response.error || { message: 'Password reset failed' });
        return { success: false, error: response.error };
      }

      return { success: true };
    } catch (err: any) {
      const error = { message: err.message || 'Password reset failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (formData: NewPasswordFormData) => {
    setLoading(true);
    setError(null);

    if (formData.newPassword !== formData.confirmPassword) {
      const error = { message: 'Passwords do not match' };
      setError(error);
      setLoading(false);
      return { success: false, error };
    }

    if (formData.newPassword.length < 6) {
      const error = { message: 'Password must be at least 6 characters' };
      setError(error);
      setLoading(false);
      return { success: false, error };
    }

    try {
      const response = await ResetPasswordService.updatePassword(formData.newPassword);
      
      if (!response.success) {
        setError(response.error || { message: 'Password update failed' });
        return { success: false, error: response.error };
      }

      return { success: true };
    } catch (err: any) {
      const error = { message: err.message || 'Password update failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const verifyResetToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await ResetPasswordService.verifyResetToken();
      
      if (!response.success) {
        setError(response.error || { message: 'Token verification failed' });
        return { success: false, error: response.error };
      }

      return { success: true };
    } catch (err: any) {
      const error = { message: err.message || 'Token verification failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    resetPassword,
    updatePassword,
    verifyResetToken,
    loading,
    error,
    clearError: () => setError(null)
  };
};
