// src/auth/types.ts
import { User } from '@supabase/supabase-js';
import { Profile } from '../types/database';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logActivity: (activityType: string, description: string) => Promise<void>;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  email: string;
  password: string;
  fullName: string;
}

export interface ResetPasswordFormData {
  email: string;
}

export interface NewPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthResponse {
  success: boolean;
  error?: AuthError;
  data?: any;
}
