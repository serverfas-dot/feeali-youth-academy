/*
# Create site settings table

1. New Tables
- `site_settings` stores app-wide configuration as key/value pairs.
- `key` (text, primary key) identifies the setting.
- `value` (text) stores the setting value.
- `updated_at` (timestamptz) tracks when the setting was last changed.

2. Initial Data
- Inserts a `dhivehi_enabled` setting with value `true` so the Dhivehi language toggle is visible by default.

3. Security
- Row level security is enabled.
- Anyone (anon + authenticated) can read settings so the public form knows which features are enabled.
- Only authenticated admins can update settings.
*/

CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read settings" ON public.site_settings;
CREATE POLICY "Anyone can read settings"
ON public.site_settings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can update settings" ON public.site_settings;
CREATE POLICY "Admins can update settings"
ON public.site_settings FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can insert settings" ON public.site_settings;
CREATE POLICY "Admins can insert settings"
ON public.site_settings FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

INSERT INTO public.site_settings (key, value)
VALUES ('dhivehi_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
