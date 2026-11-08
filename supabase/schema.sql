-- Money-verse database bootstrap, for a BRAND-NEW Supabase project only.
-- Do NOT run this file on the existing project; run migrations/20261108_teacher_backend.sql instead.
-- The deployment already tested on your Supabase project uses this schema and API contract.
BEGIN;

CREATE TABLE IF NOT EXISTS public.classes (
  code TEXT PRIMARY KEY CHECK (code ~ '^[A-Z0-9-]{4,14}$'),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  owner UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  class_code TEXT NOT NULL REFERENCES public.classes(code) ON DELETE CASCADE,
  student_id TEXT NOT NULL CHECK (student_id ~ '^[a-z0-9]{3,12}$'),
  summary JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS progress_class_time ON public.progress(class_code, received_at);
CREATE INDEX IF NOT EXISTS progress_student_recent ON public.progress(class_code, student_id, received_at DESC);
CREATE INDEX IF NOT EXISTS classes_owner ON public.classes(owner);

CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.classes, public.progress, public.teacher_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.classes TO authenticated;
GRANT SELECT, DELETE ON TABLE public.progress TO authenticated;
GRANT SELECT, UPDATE(display_name) ON TABLE public.teacher_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

CREATE POLICY teacher_profile_self_read ON public.teacher_profiles
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY teacher_profile_self_update ON public.teacher_profiles
  FOR UPDATE TO authenticated USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY classes_owner_access ON public.classes FOR ALL TO authenticated
USING (
  owner = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.teacher_profiles tp WHERE tp.id = (SELECT auth.uid())
  )
)
WITH CHECK (
  owner = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.teacher_profiles tp WHERE tp.id = (SELECT auth.uid())
  )
);

CREATE POLICY progress_owner_read ON public.progress FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.code = class_code AND c.owner = (SELECT auth.uid())
  )
);
CREATE POLICY progress_owner_delete ON public.progress FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.code = class_code AND c.owner = (SELECT auth.uid())
  )
);

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

INSERT INTO public.teacher_profiles(id)
SELECT id FROM auth.users WHERE email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Student class lookup (no student authentication needed).
CREATE OR REPLACE FUNCTION public.class_name(p_code TEXT)
RETURNS TEXT LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_code TEXT;
BEGIN
  v_code := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9-]', '', 'g'));
  IF v_code ~ '^HYD[A-Z0-9]{4,5}$' THEN
    v_code := 'HYD-' || substr(v_code, 4);
  END IF;
  RETURN (SELECT name FROM public.classes WHERE code = v_code);
END;
$$;

-- Rate-limited student progress submission: same RPC signature as the frontend.
CREATE OR REPLACE FUNCTION public.submit_progress(p_code TEXT, p_summary JSONB)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_code TEXT; v_student TEXT;
BEGIN
  v_code := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9-]', '', 'g'));
  IF v_code ~ '^HYD[A-Z0-9]{4,5}$' THEN
    v_code := 'HYD-' || substr(v_code, 4);
  END IF;
  IF jsonb_typeof(p_summary) IS DISTINCT FROM 'object' THEN RETURN 'invalid'; END IF;
  IF p_summary->>'v' IS DISTINCT FROM '1' THEN RETURN 'invalid'; END IF;
  v_student := p_summary->>'id';
  IF v_student IS NULL OR v_student !~ '^[a-z0-9]{3,12}$' THEN RETURN 'invalid'; END IF;
  IF pg_column_size(p_summary) >= 4096 THEN RETURN 'invalid'; END IF;
  IF p_summary ? 'roll' THEN
    IF jsonb_typeof(p_summary->'roll') NOT IN ('null', 'string') THEN RETURN 'invalid'; END IF;
    IF jsonb_typeof(p_summary->'roll') = 'string'
      AND p_summary->>'roll' !~ '^[0-9]{4}$' THEN RETURN 'invalid'; END IF;
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(p_summary) AS k(field)
    WHERE k.field NOT IN (
      'v','id','cohort','roll','at','lang','persona','lite',
      'places','skills','happy','breaks','habits','p4'
    )
  ) THEN RETURN 'invalid'; END IF;
  IF jsonb_typeof(p_summary->'places') IS DISTINCT FROM 'object'
    OR jsonb_typeof(p_summary->'skills') IS DISTINCT FROM 'object' THEN RETURN 'invalid'; END IF;
  IF coalesce(p_summary->>'lang', '') NOT IN ('en', 'hi', 'te') THEN RETURN 'invalid'; END IF;
  IF jsonb_typeof(p_summary->'happy') IS DISTINCT FROM 'number' THEN RETURN 'invalid'; END IF;
  IF (p_summary->>'happy')::numeric NOT BETWEEN 0 AND 100 THEN RETURN 'invalid'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_code));
  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE code = v_code) THEN RETURN 'unknown_class'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.progress
    WHERE class_code = v_code AND student_id = v_student
      AND received_at > now() - interval '2 minutes'
  ) THEN RETURN 'too_soon'; END IF;
  IF (SELECT count(*) FROM public.progress
      WHERE class_code = v_code AND received_at > now() - interval '1 day') >= 3000
  THEN RETURN 'class_full'; END IF;

  INSERT INTO public.progress(class_code, student_id, summary)
  VALUES (v_code, v_student, jsonb_set(p_summary, '{cohort}', to_jsonb(v_code)));
  RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.class_name(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_progress(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.class_name(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_progress(TEXT, JSONB) TO anon, authenticated;


COMMIT;

-- Optional, run separately if Supabase Realtime's publication already exists:
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='progress'
     )
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.progress;
  END IF;
END;
$$;

-- Optional daily 400-day retention (enable pg_cron first, then run):
-- SELECT cron.schedule('moneyverse-progress-retention', '15 2 * * *',
--   $$ DELETE FROM public.progress WHERE received_at < now() - interval '400 days'; $$);
