import { createClient } from '@supabase/supabase-js'
import { env } from '@/env'

/**
 * Service-role Supabase client that bypasses RLS.
 * Use ONLY in server-side contexts (webhook handlers, seed scripts, admin operations).
 * NEVER import this in client components or expose to the browser.
 */
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)
