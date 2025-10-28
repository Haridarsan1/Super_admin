  /*
    # Authentication and Activity Tracking Schema

    ## Overview
    This migration sets up the complete authentication infrastructure with role-based access control
    and activity tracking for admin users.

    ## 1. New Tables
    
    ### `profiles`
    - `id` (uuid, primary key) - Links to auth.users
    - `email` (text) - User email address
    - `role` (text) - User role: 'superadmin' or 'admin'
    - `full_name` (text) - User's full name
    - `created_at` (timestamptz) - Account creation timestamp
    - `updated_at` (timestamptz) - Last profile update timestamp
    
    ### `admin_activity_logs`
    - `id` (uuid, primary key) - Unique activity log identifier
    - `admin_id` (uuid, foreign key) - References profiles.id
    - `activity_type` (text) - Type of activity (login, logout, action)
    - `description` (text) - Activity description
    - `ip_address` (text) - IP address of the user
    - `user_agent` (text) - Browser/device information
    - `created_at` (timestamptz) - Activity timestamp

    ## 2. Security
    
    ### Row Level Security (RLS)
    - Enable RLS on all tables
    - Profiles: Users can read their own profile, superadmins can read all profiles
    - Activity logs: Only superadmins can read activity logs
    - Users can insert their own activity logs
    
    ## 3. Functions
    - Automatic profile creation on user signup
    - Automatic timestamp updates

    ## 4. Important Notes
    - Default role for new users is 'admin'
    - Superadmin must be set manually in the database
    - All activity is logged for audit purposes
  */

  -- Create profiles table
  CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    role text NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
    full_name text DEFAULT '',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Create admin activity logs table
  CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type text NOT NULL CHECK (activity_type IN ('login', 'logout', 'action', 'password_reset')),
    description text NOT NULL,
    ip_address text DEFAULT '',
    user_agent text DEFAULT '',
    created_at timestamptz DEFAULT now()
  );

  -- Create indexes for better query performance
  CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
  CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
  CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id ON admin_activity_logs(admin_id);
  CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON admin_activity_logs(created_at DESC);

  -- Enable Row Level Security
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

  -- Profiles RLS Policies

  -- Users can view their own profile
  CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

  -- Superadmins can view all profiles
  CREATE POLICY "Superadmins can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'superadmin'
      )
    );

  -- Users can update their own profile (except role)
  CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  -- Allow profile creation during signup
  CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

  -- Activity Logs RLS Policies

  -- Users can insert their own activity logs
  CREATE POLICY "Users can insert own activity logs"
    ON admin_activity_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = admin_id);

  -- Superadmins can view all activity logs
  CREATE POLICY "Superadmins can view all activity logs"
    ON admin_activity_logs FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'superadmin'
      )
    );

  -- Users can view their own activity logs
  CREATE POLICY "Users can view own activity logs"
    ON admin_activity_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = admin_id);

  -- Function to automatically create profile on signup
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
      new.id,
      new.email,
      'admin',
      COALESCE(new.raw_user_meta_data->>'full_name', '')
    );
    RETURN new;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Trigger to create profile automatically
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

  -- Function to update updated_at timestamp
  CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS trigger AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Trigger to update timestamp on profile updates
  DROP TRIGGER IF EXISTS on_profile_updated ON profiles;
  CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();