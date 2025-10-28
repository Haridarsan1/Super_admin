import { createClient } from '@supabase/supabase-js';

// Try common Vite env names, allow runtime override via window.__env__ for advanced setups
const env: any = (import.meta as any)?.env || {};
const runtimeEnv = typeof window !== 'undefined' ? (window as any).__env || {} : {};

const supabaseUrl = env.VITE_SUPABASE_URL || env.VITE_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || runtimeEnv.SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || runtimeEnv.SUPABASE_ANON_KEY;

let _supabase: any = null;
let SUPABASE_CONFIGURED = true;

if (!supabaseUrl || !supabaseAnonKey) {
  // If envs missing, do not crash the app — provide a helpful runtime stub that returns
  // predictable error-shaped responses to keep the UI usable for development.
  SUPABASE_CONFIGURED = false;
  const guidance = [
    'Missing Supabase environment variables.',
    'Set the following in your local .env (Vite requires VITE_ prefix):',
    "  VITE_SUPABASE_URL=https://xyzcompany.supabase.co",
    "  VITE_SUPABASE_ANON_KEY=public-anon-key",
    '\nIf you are running on Vercel set SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_ prefixed envs) in the Vercel dashboard.',
    'If you intentionally want to run without Supabase, set window.__env = { SUPABASE_URL: "...", SUPABASE_ANON_KEY: "..." } before your app boots.'
  ].join('\n');

  console.warn(guidance);

  const makeErrorResponse = (message: string) => Promise.resolve({ data: null, error: { message } });

  const builder = (message: string) => {
    const b: any = {};
    const chainMethods = ['select','order','eq','limit','maybeSingle','insert','update','delete','single','match','throwOnError'];
    chainMethods.forEach((m) => {
      b[m] = (..._args: any[]) => b;
    });
    // Make the builder thenable so `await supabase.from(...).select(...);` resolves to an error-shaped object
    b.then = (resolve: any) => resolve({ data: null, error: { message } });
    return b;
  };

  const authStub = {
    signInWithPassword: (_body: any) => makeErrorResponse(guidance),
    signUp: (_body: any) => makeErrorResponse(guidance),
    resetPasswordForEmail: (_email: any, _opts?: any) => makeErrorResponse(guidance),
    updateUser: (_body: any) => makeErrorResponse(guidance),
    getSession: () => Promise.resolve({ data: { session: null }, error: { message: guidance } }),
    signOut: () => Promise.resolve({ data: null, error: { message: guidance } }),
    signInWithOAuth: (_opts: any) => Promise.resolve({ data: null, error: { message: guidance } }),
    exchangeCodeForSession: (_code: any) => Promise.resolve({ data: null, error: { message: guidance } }),
    verifyOtp: (_opts: any) => Promise.resolve({ data: null, error: { message: guidance } }),
    setSession: (_sess: any) => Promise.resolve({ data: null, error: { message: guidance } }),
    recoverSession: (_token: any) => Promise.resolve({ data: null, error: { message: guidance } }),
  };

  const channelStub = () => ({
    on: () => ({ subscribe: () => ({}) }),
    subscribe: () => ({})
  });

  _supabase = {
    from: (_table: string) => builder(guidance),
    auth: authStub,
    channel: channelStub,
    // safe no-op storage and functions
    storage: { from: () => ({ getPublicUrl: () => ({ data: null, error: { message: guidance } }) }) },
    rpc: () => Promise.resolve({ data: null, error: { message: guidance } }),
  };
} else {
  try {
    _supabase = createClient(String(supabaseUrl), String(supabaseAnonKey));
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    throw err;
  }
}

export const supabase = _supabase;
export const SUPABASE_CONFIGURED_FLAG = SUPABASE_CONFIGURED;
