/*
# Add contact number to membership applications

1. Modified Tables
- `membership_applications` gets a new `contact_number` column (text, not null) to store the applicant's phone number.
2. Security
- No policy changes; existing RLS policies already cover the new column.
3. Important notes
- The column is added with a safe default of empty string for existing rows, then altered to NOT NULL so new submissions must include it.
*/

ALTER TABLE public.membership_applications
  ADD COLUMN IF NOT EXISTS contact_number text NOT NULL DEFAULT '';
