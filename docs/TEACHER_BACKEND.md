# MONEY VERSE: teacher and student backend

Teachers sign in, create classes, receive student progress and read class reports.
Students play without an account and share progress using a class code.

## Frontend

- Teacher portal: `/teacher`, accessible directly without starting a game.
- Home link: **For teachers**.
- Teacher tools and student-sharing helpers live in `src/teacher/`.
- `src/teacher/cloud.ts` is the only backend adapter.
- Signup calls `cloud.signUp(email, password)` with no additional profile fields.
- Teacher identity is the authenticated email address.
- Classes, reports, lesson slides, student roll lists and local labels are retained.
- Student names remain in the teacher's browser. The backend receives a student
  code, class code, roll number and progress summary.
- The browser migrates prior classroom snapshots to `mm-slots-teacher-v1` while
  retaining the source snapshot as a backup. Player save slots are excluded.

## Backend contract

- Supabase Auth manages teacher credentials.
- `teacher_profiles(id, display_name, created_at)` identifies teacher accounts.
- `classes(code, name, owner, created_at)` belongs to its authenticated teacher.
- `progress(id, class_code, student_id, summary, received_at)` stores progress.
- `class_name(p_code)` looks up a class for a student.
- `submit_progress(p_code, p_summary)` validates and accepts student progress.
- Return values: `ok`, `unknown_class`, `invalid`, `too_soon`, `class_full`.
- Realtime INSERT notifications and periodic refresh update teacher reports.
- Existing retention is 400 days when the scheduled cleanup job is configured.

## Setup

1. Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env.example` in
   your uncommitted `.env.local`. Browser code must use a publishable key.
2. For a new database, use `supabase/schema.sql`. For an existing deployment,
   apply `supabase/migrations/20261108_teacher_backend.sql` only if it has not
   already been applied. Do not rerun the fresh-install schema on a live database.
3. In Supabase Authentication URL Configuration, allow the deployed
   `https://YOUR-SITE/teacher` URL and `http://localhost:5173/teacher` for local
   password-reset testing. The adapter sends reset links to `/teacher`.
4. Verify teacher login, class creation, class lookup, submission, and isolation
   between two teachers after database changes.

This source update does not change a deployed database or its Auth URL settings.
Existing teacher tables, ownership checks and student RPCs are retained.

## Local checks

```bash
npm test
npx tsc -b
node --env-file=.env.local tools/teacher-backend-smoke.mjs EXISTING-CLASS-CODE
```

The public API smoke test reads only. Browser checks are in
`tools/e2e-teacher.mjs`. A live backend check needs your configured Supabase
project; source tests alone cannot verify a deployed policy or email delivery.

## Deployment notes

Signup creates an app teacher profile for any email signup; it is not an
independent verification that the person is a teacher. Invitations can be added
for school deployment. Student submissions cannot independently prove gameplay.
Keep appropriate access controls and retention for roll numbers and progress.
The repo's empty Case Files content is a separate production-build limitation.
