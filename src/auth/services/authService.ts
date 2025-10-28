// src/auth/services/authService.ts
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types/database';

export class AuthService {
  /**
   * Fetch user profile from database
   */
  static async fetchProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data || null;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  }

  /**
   * Log user activity
   */
  static async logActivity(
    userId: string,
    activityType: string,
    description: string
  ): Promise<void> {
    try {
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: userId,
          activity_type: activityType,
          description,
          ip_address: '',
          user_agent: navigator.userAgent || '',
        });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  /**
   * Get base URL for redirects
   */
  static getBaseUrl(): string {
    // 1) In-browser runtime: use actual origin; if localhost/127.* keep it for dev
    if (typeof window !== 'undefined' && window.location?.origin) {
      const origin = window.location.origin;
      if (origin.includes('localhost') || origin.startsWith('http://127.')) {
        return origin; // dev
      }
    }

    // 2) Vite envs (configure VITE_SITE_URL in Vercel; optionally in .env.local for dev)
    const viteEnv = (import.meta as any)?.env || {};
    const siteUrl = viteEnv.VITE_SITE_URL || viteEnv.VITE_PUBLIC_SITE_URL;
    if (siteUrl) return String(siteUrl);

    const vercelUrl = viteEnv.VITE_VERCEL_URL || viteEnv.VERCEL_URL; // may be hostonly
    if (vercelUrl) return `https://${String(vercelUrl).replace(/^https?:\/\//, '')}`;

    // 3) Mode-based fallbacks
    if (viteEnv?.PROD) {
      return 'https://super-admin-sigma-one.vercel.app';
    }
    return 'http://localhost:5173';
  }
}
