-- Post-setup: rotate the admin password in Supabase Dashboard (Authentication → Users).
-- This migration does not store credentials; it only ensures the admin account stays confirmed.
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
);
