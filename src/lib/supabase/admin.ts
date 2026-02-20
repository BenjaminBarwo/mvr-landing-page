import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client that bypasses RLS.
 * Use ONLY in server-side contexts (webhook handlers, seed scripts, admin operations).
 * NEVER import this in client components or expose to the browser.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
