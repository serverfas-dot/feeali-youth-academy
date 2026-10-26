/*
# Secure membership application photo storage

1. Storage changes
- Makes the `application-photos` bucket private.
- Limits uploads to JPEG, PNG, and WebP images up to 5 MB.

2. Access changes
- Anonymous visitors may upload photos for a new application.
- Only authenticated users listed in `admin_users` may read or delete stored photos.
- Removes the previous public read policy so ID documents cannot be opened by anyone who knows a URL.

3. Important notes
- Existing application photo values remain unchanged.
- New application photo values are storage paths, not permanent public URLs.
- Admin screens should request short-lived signed URLs when displaying photos.
*/

UPDATE storage.buckets
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
WHERE id = 'application-photos';

DROP POLICY IF EXISTS "Anyone can read application photos" ON storage.objects;

DROP POLICY IF EXISTS "Admins can read application photos" ON storage.objects;
CREATE POLICY "Admins can read application photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-photos'
  AND EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid())
);
