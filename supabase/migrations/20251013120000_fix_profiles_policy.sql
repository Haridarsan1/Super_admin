-- Fix recursive profiles policy by introducing helper and updating policies

-- Helper function to check if a user is superadmin without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_superadmin(check_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = check_uid
      AND p.role = 'superadmin'
  );
$$;

COMMENT ON FUNCTION public.is_superadmin(uuid)
  IS 'Returns true if the given user id has role = superadmin in public.profiles';

-- Allow app roles to execute helper
GRANT EXECUTE ON FUNCTION public.is_superadmin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin(uuid) TO anon;

-- Update profiles SELECT policy to avoid recursive reference
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
CREATE POLICY "Superadmins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Update activity logs policy to reuse helper (no recursion risk here, but consistent)
DROP POLICY IF EXISTS "Superadmins can view all activity logs" ON public.admin_activity_logs;
CREATE POLICY "Superadmins can view all activity logs"
  ON public.admin_activity_logs FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));


