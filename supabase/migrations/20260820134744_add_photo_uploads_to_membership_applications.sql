/*
# Add photo upload fields to membership applications

1. Modified Tables
- `membership_applications`: Added three new text columns:
  - `id_card_front_url` - public URL to front side of ID card photo
  - `id_card_back_url` - public URL to back side of ID card photo
  - `passport_photo_url` - public URL to passport-size photo
  All three are nullable so existing rows are unaffected.

2. New Storage
- Created `application-photos` public storage bucket for uploaded applicant photos.
- Files stored with UUID-based names so URLs are unguessable.

3. Storage Policies
- Anyone (anon + authenticated) can upload to the bucket (public form submissions).
- Anyone can read from the bucket (public bucket, photos shown in admin).
- Only authenticated admins can delete photos.

4. Security Notes
- Photos are stored in a public bucket with random UUID filenames.
- Only admins can view which photo belongs to which applicant (via the application record).
- Only admins can delete photos.
*/

ALTER TABLE public.membership_applications
  ADD COLUMN IF NOT EXISTS id_card_front_url text,
  ADD COLUMN IF NOT EXISTS id_card_back_url text,
  ADD COLUMN IF NOT EXISTS passport_photo_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('application-photos', 'application-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can upload application photos" ON storage.objects;
CREATE POLICY "Anyone can upload application photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'application-photos');

DROP POLICY IF EXISTS "Anyone can read application photos" ON storage.objects;
CREATE POLICY "Anyone can read application photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'application-photos');

DROP POLICY IF EXISTS "Admins can delete application photos" ON storage.objects;
CREATE POLICY "Admins can delete application photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'application-photos' AND EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));
