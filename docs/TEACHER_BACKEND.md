# Money-verse: Teacher backend v1 (team handoff)

## Goal and boundary

This is a **teacher-only Supabase backend**. Teachers sign in by email/password, own classes, receive summarized student progress, and read reports. Students do not sign in. **No NGO/organisation table, profile field or organisation metadata is part of the backend.**

### Current production contract (unchanged)

- `auth.users` contains email/password credentials handled by Supabase Auth.
- `public.teacher_profiles(id, display_name, created_at)` is a minimal teacher-only profile.
- `public.classes(code, name, owner, created_at)` belongs to a teacher via `owner`.
- `public.progress(id, class_code, student_id, summary, received_at)` stores anonymous progress snapshots, including the 4-digit roll field.
- `rpc('class_name', {p_code})` checks class codes for students.
- `rpc('submit_progress', {p_code, p_summary})` returns `ok`, `unknown_class`, `invalid`, `too_soon`, `class_full`.
- Realtime publishes INSERT events on `public.progress`. Clients still refresh every minute as a fallback.
- pg_cron scheduled job `moneyverse-progress-retention` expires progress after 400 days (configured in the existing database).

## Install in existing project

1. Back up or commit your existing local work. Copy files from this ZIP into the **repository root**, preserving paths. This package changes only the backend adapter, SQL, and documentation; it does not modify game screens or existing license files.
2. Run `supabase/migrations/20261108_teacher_backend.sql` in **your existing Supabase project -> SQL Editor**. This is an additive migration: it creates teacher profiles, migrates existing accounts, removes legacy `org` user metadata and requires teacher profiles in the existing class ownership policy. **Do not run `supabase/schema.sql` on an existing project.** The schema file documents a fresh installation.
3. Keep your existing `.env.local` on your laptop. It must point to your own project using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never commit it or use `service_role`/`sb_secret_` keys in browser code.
4. `src/teacher/cloud.ts` is now the actual backend adapter. `src/ngo/cloud.ts` is a compatibility re-export, so the unfinished frontend and student-sharing code keep working. Existing calls `cloud.signUp(email,password,org)` are accepted temporarily but the `org` argument is ignored and **never sent to Supabase**.
5. On the frontend, the old `/ngo` route and folder are still present. The frontend team can migrate them to `/teacher` separately. They must update password reset redirect, auth form, profile and relevant links together; do not delete or rename those files prematurely.

Run a small public API smoke test after setting `.env.local`:

```bash
node --env-file=.env.local tools/teacher-backend-smoke.mjs HYD-YKMRN
```

This does not modify the database. Your more extensive teacher isolation and Realtime tests have already passed separately.

## Frontend team TODO (not part of the backend commit)

- Replace UI terms `NGO`, `facilitator` and `organisation` with teacher-specific content.
- Remove the organization input from `src/ngo/Auth.tsx`, call `cloud.signUp(email,password)`.
- Refactor `useNgo` store user data to `{email}` or a teacher profile; remove legacy `org` reading in `src/ngo/NgoScreen.tsx` and `profile.tsx`.
- Switch `/ngo` routing and links to `/teacher` together; then change `resetPassword` redirect in `src/teacher/cloud.ts` to `/teacher` and remove the re-export bridge.
- Migrate the progress summary helper out of the legacy `src/ngo/summary.ts` directory when frontend routes and imports are updated.

## What's already tested on the current Supabase project

- Teacher login, teacher class creation, student class lookup, and accepted student progress.
- Teacher-only read access, cross-teacher read isolation and blocked unauthorized writes/deletes.
- Progress rate limit, basic validation, Realtime INSERT delivery, successful cleanup of test records.
- Active scheduled 400-day retention job.

The teacher_profiles migration itself has **not been executed or verified** by this package. Run it in Supabase once, then verify the existing teacher account still reads its own class and that a new teacher can create a class. Do not assume the deployed database has the migration until it has run.

## Security notes for hardening later

- Email signup is currently open to anyone. A teacher profile is automatically created for any email signup. This identifies the app role, **not a vetted teacher**; consider invitations/approval before real school deployment.
- The public student submission endpoint cannot verify actual gameplay. Add server-side score validation and stronger anti-abuse controls before production.
- Student roll numbers and scores are personal/student data. Document consent, access and retention; don't claim they're fully anonymous.
- Postgres Changes Realtime is working for your test; for scale consider Supabase Broadcast and background polling fallback.
- Do not treat the frontend build as passed while unrelated empty game source/assets remain in your repository.
