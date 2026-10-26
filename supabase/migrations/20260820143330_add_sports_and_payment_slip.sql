/*
# Add sports table and payment slip to membership applications

1. New Tables
- `sports` stores the list of sports available on the membership form, each with a name, charge (in MVR), and display order.
- Seeded with 4 default sports (Volleyball, Football, Handball, Swimming) each at 250 MVR.

2. Modified Tables
- `membership_applications`: Added `payment_slip_url` text column to store the path to the uploaded payment transfer slip.

3. Security
- `sports`: RLS enabled. Anyone (anon + authenticated) can read sports. Only authenticated admins can insert, update, or delete sports.
- `membership_applications`: Existing policies already cover the new nullable column.
*/

CREATE TABLE IF NOT EXISTS public.sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  charge integer NOT NULL DEFAULT 250,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read sports" ON public.sports;
CREATE POLICY "Anyone can read sports"
ON public.sports FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can insert sports" ON public.sports;
CREATE POLICY "Admins can insert sports"
ON public.sports FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update sports" ON public.sports;
CREATE POLICY "Admins can update sports"
ON public.sports FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete sports" ON public.sports;
CREATE POLICY "Admins can delete sports"
ON public.sports FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

INSERT INTO public.sports (name, charge, display_order) VALUES
  ('Volleyball', 250, 1),
  ('Football', 250, 2),
  ('Handball', 250, 3),
  ('Swimming', 250, 4)
ON CONFLICT DO NOTHING;

ALTER TABLE public.membership_applications
  ADD COLUMN IF NOT EXISTS payment_slip_url text;

GRANT SELECT ON public.sports TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sports TO authenticated;
