import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    // Database
    DATABASE_URL: z.string().trim().url(),
    DIRECT_URL: z.string().trim().url(),
    // Supabase
    SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1),
    // Stripe
    STRIPE_SECRET_KEY: z.string().trim().startsWith('sk_'),
    STRIPE_WEBHOOK_SECRET: z.string().trim().startsWith('whsec_'),
    // Resend (transactional email)
    RESEND_API_KEY: z.string().trim().min(1),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().trim().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().trim().startsWith('pk_'),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
})
