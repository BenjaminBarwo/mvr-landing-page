import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

interface AdminAccount {
  email: string
  role: 'approver' | 'viewer'
}

const admins: AdminAccount[] = [
  { email: 'approver@mvr.internal', role: 'approver' },
  { email: 'viewer1@mvr.internal', role: 'viewer' },
  { email: 'viewer2@mvr.internal', role: 'viewer' },
]

async function seedAdmins() {
  console.log('Seeding admin accounts...\n')

  for (const admin of admins) {
    const password = randomUUID()

    const { data, error } = await supabase.auth.admin.createUser({
      email: admin.email,
      password,
      email_confirm: true,
      app_metadata: { role: admin.role },
    })

    if (error) {
      if (error.message.includes('already been registered')) {
        console.log(`  SKIP  ${admin.email} (already exists)`)
        continue
      }
      console.error(`  FAIL  ${admin.email}: ${error.message}`)
      continue
    }

    console.log(`  OK    ${admin.email}`)
    console.log(`        Role: ${admin.role}`)
    console.log(`        Password: ${password}`)
    console.log(`        ID: ${data.user.id}`)
    console.log()
  }

  console.log('Done. Save the passwords above — they cannot be retrieved later.')
}

seedAdmins().catch(console.error)
