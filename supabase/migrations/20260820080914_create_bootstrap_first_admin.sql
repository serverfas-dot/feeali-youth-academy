/*
# Bootstrap first admin account

1. New Functions
- `bootstrap_first_admin()` is a SECURITY DEFINER function that promotes the calling authenticated user to admin ONLY when the `admin_users` table is empty. This provides a safe one-time setup path: the first admin signs up, calls this function, and becomes the administrator. All subsequent calls fail because the table is no longer empty.

2. Security
- The function runs as its owner (bypassing RLS) but performs its own authorization check: it refuses to add anyone if an admin already exists.
- EXECUTE is granted to authenticated users only; anon cannot call it.
- The function uses `SET search_path = public` to prevent search_path shadowing.
*/

CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM public.admin_users;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Admin account already exists. Contact the current administrator.';
  END IF;

  INSERT INTO public.admin_users (user_id) VALUES (auth.uid());
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_first_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;
