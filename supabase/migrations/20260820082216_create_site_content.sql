/*
# Create site_content table for editable text

1. New Tables
- `site_content` stores every heading, label, and message shown on the public form and admin portal, in both English and Dhivehi. The admin can create, edit, and delete any entry from the dashboard.

2. Columns
- `key` (text, primary key) — the identifier used by the frontend to look up the text.
- `en` (text) — the English value.
- `dv` (text) — the Dhivehi value.
- `updated_at` (timestamptz) — automatically updated on every change.

3. Security
- Row level security is enabled.
- Public (anon + authenticated) can SELECT so the form loads with the correct text.
- Only authenticated accounts listed in `admin_users` can INSERT, UPDATE, or DELETE content rows.

4. Seeding
- All default text values from the application are seeded so the admin sees every editable string immediately.
*/

CREATE TABLE IF NOT EXISTS public.site_content (
  key text PRIMARY KEY,
  en text NOT NULL,
  dv text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read content" ON public.site_content;
CREATE POLICY "Public can read content"
ON public.site_content FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can insert content" ON public.site_content;
CREATE POLICY "Admins can insert content"
ON public.site_content FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update content" ON public.site_content;
CREATE POLICY "Admins can update content"
ON public.site_content FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete content" ON public.site_content;
CREATE POLICY "Admins can delete content"
ON public.site_content FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.set_content_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS site_content_updated_at ON public.site_content;
CREATE TRIGGER site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW EXECUTE FUNCTION public.set_content_updated_at();

INSERT INTO public.site_content (key, en, dv) VALUES
('navForm', 'Membership form', 'މެމްބަރޝިޕް ފޯމް'),
('navAdmin', 'Admin portal', 'އެޑްމިން ޕޯޓަލް'),
('eyebrow', 'FEALI YOUTH ACADEMY', 'ފީއަލީ ޔޫތު އެކެޑަމީ'),
('title', 'Make your next move count.', 'ތިޔަ ކުރާ ފަހު ކަން މުހިންމު.'),
('subtitle', 'Join a community built to help young people learn, grow, and lead through sport.', 'ކުޅިވަރުން ޒުވާނުން ދަސްކޮށް، ތަރައްޤީކޮށް، ރައްޔިތުންނަށް ގެންދެވޭ ކޮމިއުނިޓީއަކަށް ވަދެލާ.'),
('start', 'Start application', 'އެޕްލިކޭޝަން ފެށޭ'),
('note', 'Takes about 3 minutes · No payment required today', 'ގާތްގަނޑަކަށް 3 މިނިޓް · މިހާރު ފައިސާ ނުދޭ'),
('details', 'Personal details', 'މީހާގެ ތަފްސީލުތައް'),
('detailsHint', 'Tell us a little about yourself.', 'ތިޔަބަހެއް ކުޑަކޮށް ބުނެލަން.'),
('fullName', 'Full name', 'ނަންފުޅު'),
('dob', 'Date of birth', 'އުފަން ތާރީޚް'),
('age', 'Age', 'އުމުރު'),
('id', 'ID card number', 'އައިޑީ ކާޑު ނަންބަރު'),
('permanent', 'Permanent address', 'ދާއިމީ އެޑްރެސް'),
('present', 'Present address', 'މިހާރު އެޑްރެސް'),
('island', 'Island', 'ރަށް'),
('sports', 'Preferred sports', 'ކުޅެވޭ ކުޅިވަރުތައް'),
('sportsHint', 'Choose all that interest you', 'އެދޭ ކުޅިވަރުތައް ހޮވާލާ'),
('continue', 'Review application', 'ފޯމް ބަލާލާ'),
('fee', 'Registration fee of MVR 200 is collected after approval.', 'ރަޖިސްޓްރޭޝަން ފީ MVR 200 އެޕްރޫވްކުރުމަށް ފަހު ދެވޭނެ.'),
('submit', 'Submit application', 'އެޕްލިކޭޝަން ފޮނުވާ'),
('back', 'Back to edit', 'އިސްލާހަށް ދާން'),
('review', 'Review your details', 'ތިޔަ ބެލި ތަފްސީލު'),
('reviewHint', 'Please make sure everything looks right before sending.', 'ފޮނުވުމުގެ ކުރިން ހުރިހާ ކަމެއް ރަނގަޅަށް ބަލާލާ.'),
('successTitle', 'Application received', 'އެޕްލިކޭޝަން ލިބިއްޖެ'),
('successText', 'Thank you for applying to Feeali Youth Academy. Our team will review your application and contact you soon.', 'ފީއަލީ ޔޫތު އެކެޑަމީއަށް އެދިފިން. ތިޔަގެ ފޯމް ބަލައިގެން ވަގުތުން ގުޅާނެ.'),
('newApplication', 'Submit another application', 'އަލުން ފޯމެއް ފޮނުވާ'),
('secure', 'Your information is kept private and is only used for membership processing.', 'ތިޔަގެ މައުލޫމާތު މަސްތައްވެރިކޮށް ބެލޭނެ.'),
('adminTitle', 'Welcome back', 'މަރުޙަބާ'),
('adminText', 'Sign in to manage membership applications.', 'މެމްބަރޝިޕް އެޕްލިކޭޝަންތައް ބެލުމަށް ލޮގްއިންވޭ.'),
('email', 'Admin email', 'އެޑްމިން އީމެއިލް'),
('password', 'Password', 'ޕާސްވޯޑް'),
('signIn', 'Sign in', 'ލޮގްއިން'),
('create', 'First-time setup', 'ފުރަތަމަ ސެޓަޕް'),
('createHint', 'Create the first admin account for this academy.', 'މި އެކެޑަމީގެ ފުރަތަމަ އެޑްމިން އެކައުންޓެއް ހަދާ.'),
('createAccount', 'Create admin account', 'އެޑްމިން އެކައުންޓް ހަދާ'),
('switchPublic', 'Back to public form', 'ފޯމަށް އެނބުރޭ'),
('dashboard', 'Applications', 'އެޕްލިކޭޝަންތައް'),
('total', 'Total applications', 'ޖުމްލަ އެޕްލިކޭޝަން'),
('pending', 'Needs attention', 'ބެލުމަށް ބާކީ'),
('approved', 'Approved', 'އެޕްރޫވްކުރެވިފައި'),
('search', 'Search by name, ID or island', 'ނަން، ID ނުވަތަ ރަށުން ހޯދާ'),
('all', 'All statuses', 'ހުރިހާ ސްޓޭޓަސް'),
('noResults', 'No applications match your search.', 'ތިޔަ ހޯދާފައިވާ އެޕްލިކޭޝަން ނެތް.'),
('signOut', 'Sign out', 'ލޮގްއައުޓް'),
('status', 'Status', 'ސްޓޭޓަސް'),
('submitted', 'Submitted', 'ފޮނުވި ތާރީޚް'),
('updateError', 'Could not save that change. Please try again.', 'މި ބަދަލު ސޭވްކުރެވިއްޖެއް ނޫން.'),
('submitError', 'Could not submit your application. Please try again.', 'ތިޔަގެ ފޯމް ފޮނުވެއްޖެއް ނޫން.'),
('authError', 'We could not sign you in. Please check your details.', 'ލޮގްއިންވެއްޖެއް ނޫން. ތަފްސީލު ބަލާލާ.'),
('deleteConfirm', 'Delete this application permanently?', 'މި އެޕްލިކޭޝަން ދާއިމީކޮށް ޑިލީޓްކުރަންތަ؟'),
('emptySports', 'Select at least one sport.', 'ކުޅިވަރެއް ހޮވާލާ.'),
('contentTab', 'Content', 'ލިޔުންތައް'),
('contentManager', 'Text content', 'ލިޔުންތައް'),
('contentManagerHint', 'Edit or delete any text shown on the form in both languages.', 'ފޯމުގައި ފެނޭ ހުރިހާ ލިޔުމެއް އެއް ބަހުން އިސްލާހުން ނުވަތަ ޑިލީޓްކުރޭ.'),
('contentKey', 'Key', 'ކީ'),
('englishText', 'English', 'އިނގިރިސި'),
('dhivehiText', 'Dhivehi', 'ދިވެހި'),
('saveContent', 'Save', 'ސޭވް'),
('addContent', 'Add new', 'އިތުރުކުރޭ'),
('searchContent', 'Search texts', 'ލިޔުންތައް ހޯދާ'),
('deleteContentConfirm', 'Delete this text permanently?', 'މި ލިޔުން ދާއިމީކޮށް ޑިލީޓްކުރަންތަ؟'),
('newKeyPlaceholder', 'new_key', 'އައު_ކީ'),
('contentError', 'Could not save. Please try again.', 'ސޭވްކުރެވިއްޖެއް ނޫން. އަލުން މަސައްކަތްކުރޭ.')
ON CONFLICT (key) DO NOTHING;
