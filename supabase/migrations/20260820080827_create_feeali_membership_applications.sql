/*
# Create Feeali Youth Academy membership applications

1. New Tables
- `membership_applications` stores public membership submissions with identity, address, island, age, and preferred sports information.
- `admin_users` stores the small allowlist of authenticated accounts that may manage submissions.

2. Application columns
- `id`, `created_at`, `updated_at` identify each submission.
- `full_name`, `date_of_birth`, `permanent_address`, `present_address`, `id_card_no`, `age`, and `island` store the form's personal details.
- `preferred_sports` stores one or more selected sports.
- `status` stores the admin workflow state: `new`, `contacted`, or `approved`.

3. Security
- Row level security is enabled on both tables.
- Anyone can submit a membership application, but only authenticated accounts listed in `admin_users` can read, update, or delete submissions.
- Admin allowlist rows can only be read by the matching signed-in account; there is no public policy to create or modify admin access.

4. Important notes
- The public form intentionally permits anonymous INSERT only; it does not expose submitted rows back to visitors.
- Admin access is controlled by Supabase email/password authentication plus the `admin_users` allowlist.
*/

CREATE TABLE IF NOT EXISTS public.membership_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  permanent_address text NOT NULL,
  present_address text NOT NULL,
  id_card_no text NOT NULL,
  age integer NOT NULL CHECK (age BETWEEN 1 AND 120),
  island text NOT NULL,
  preferred_sports text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'approved'))
);

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS membership_applications_created_at_idx ON public.membership_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS membership_applications_status_idx ON public.membership_applications (status);

ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit memberships" ON public.membership_applications;
CREATE POLICY "Public can submit memberships"
ON public.membership_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view memberships" ON public.membership_applications;
CREATE POLICY "Admins can view memberships"
ON public.membership_applications FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update memberships" ON public.membership_applications;
CREATE POLICY "Admins can update memberships"
ON public.membership_applications FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete memberships" ON public.membership_applications;
CREATE POLICY "Admins can delete memberships"
ON public.membership_applications FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can read own access" ON public.admin_users;
CREATE POLICY "Admins can read own access"
ON public.admin_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_membership_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS membership_applications_updated_at ON public.membership_applications;
CREATE TRIGGER membership_applications_updated_at
BEFORE UPDATE ON public.membership_applications
FOR EACH ROW EXECUTE FUNCTION public.set_membership_updated_at();

REVOKE ALL ON public.admin_users FROM anon, authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
REVOKE UPDATE, DELETE ON public.membership_applications FROM anon;
GRANT INSERT ON public.membership_applications TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.membership_applications TO authenticated;
