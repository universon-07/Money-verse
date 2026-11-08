// Small public-endpoint smoke test; does not use teacher credentials or modify records.
// Run: node --env-file=.env.local tools/teacher-backend-smoke.mjs [existing-class-code]
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL?.trim()
const key = process.env.VITE_SUPABASE_ANON_KEY?.trim()
const code = process.argv[2] || 'HYD-YKMRN'

if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)) {
  console.error('Missing or invalid Supabase configuration in .env.local')
  process.exit(1)
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

try {
  const { data: className, error: lookupError } = await client.rpc('class_name', { p_code: code })
  if (lookupError) throw lookupError
  console.log(`Class lookup API: OK (${className || 'class not found'})`)

  // Anonymous requests must not receive student rows.
  const { data: rows, error: readError } = await client.from('progress')
    .select('student_id').limit(1)
  if (!readError && rows?.length) {
    throw new Error('SECURITY CHECK FAILED: anonymous progress reading succeeded')
  }
  console.log('Anonymous progress read: blocked')
  console.log('Teacher backend smoke test: PASSED')
} catch (error) {
  console.error('Teacher backend smoke test: FAILED:', error.message)
  process.exitCode = 1
}
