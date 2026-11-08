-- Money-verse teacher-only backend migration (for the EXISTING Supabase project).
-- Safe to re-run. Does not replace classes/progress/submit_progress/class_name.
-- Execute once in Supabase SQL Editor, as the project's administrative SQL role.
BEGIN;

-- Teacher identities are auth.users records, never organisations.
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.teacher_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE(display_name) ON TABLE public.teacher_profiles TO authenticated;

DROP POLICY IF EXISTS teacher_profile_self_read ON public.teacher_profiles;
CREATE POLICY teacher_profile_self_read ON public.teacher_profiles
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
DROP POLICY IF EXISTS teacher_profile_self_update ON public.teacher_profiles;
CREATE POLICY teacher_profile_self_update ON public.teacher_profiles
  FOR UPDATE TO authenticated USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Add a teacher profile whenever an email user registers.
CREATE OR REPLACE FUNCTION public.create_teacher_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    INSERT INTO public.teacher_profiles(id) VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_teacher_profile() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS moneyverse_teacher_signup ON auth.users;
CREATE TRIGGER moneyverse_teacher_signup AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_teacher_profile();

-- Keep the teacher accounts and classes you already created.
INSERT INTO public.teacher_profiles(id)
SELECT id FROM auth.users WHERE email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Remove historical organisation metadata, if the older UI ever supplied it.
-- Do not change emails, password hashes, IDs, or unrelated user metadata.
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'org'
WHERE raw_user_meta_data ? 'org';

-- Only a signed-in, registered teacher may manage their own class.
DROP POLICY IF EXISTS classes_owner_access ON public.classes;
CREATE POLICY classes_owner_access ON public.classes
FOR ALL TO authenticated
USING (
  owner = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    WHERE tp.id = (SELECT auth.uid())
  )
)
WITH CHECK (
  owner = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.teacher_profiles tp
    WHERE tp.id = (SELECT auth.uid())
  )
);

CREATE INDEX IF NOT EXISTS progress_student_recent
ON public.progress(class_code, student_id, received_at DESC);

COMMIT;

-- Already active in your existing project:
--   public.class_name(text), public.submit_progress(text,jsonb)
--   supabase_realtime publication for public.progress
--   cron.job moneyverse-progress-retention (400-day retention)
-- No NGO or organisation tables are created by this migration.
