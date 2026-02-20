import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import houstonZips from './data/houston-zips.json'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const ROLES = [
  'agent',
  'lender',
  'inspector',
  'title_company',
  'appraiser',
  'contractor',
] as const

const BASE_CAPS: Record<string, number> = {
  agent: 5,
  lender: 3,
  inspector: 2,
  title_company: 2,
  appraiser: 2,
  contractor: 3,
}

const TIER_MULTIPLIERS: Record<string, number> = {
  premium: 1,
  standard: 1.5,
  suburban: 2,
}

interface ZipEntry {
  zip_code: string
  neighborhood: string
  tier: string
}

async function seedZips() {
  console.log(`Seeding ${houstonZips.length} ZIP codes x 6 roles...\n`)

  const rows: Array<{
    zip_code: string
    role: string
    total_cap: number
    phantom_count: number
    tier: string
    neighborhood: string
  }> = []

  for (const zip of houstonZips as ZipEntry[]) {
    for (const role of ROLES) {
      const multiplier = TIER_MULTIPLIERS[zip.tier] ?? 1.5
      const totalCap = Math.ceil(BASE_CAPS[role] * multiplier)

      rows.push({
        zip_code: zip.zip_code,
        role,
        total_cap: totalCap,
        phantom_count: 0,
        tier: zip.tier,
        neighborhood: zip.neighborhood,
      })
    }
  }

  // Upsert in batches of 500
  const batchSize = 500
  let inserted = 0

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)

    const { error } = await supabase
      .from('zip_seats')
      .upsert(batch, { onConflict: 'zip_code,role' })

    if (error) {
      console.error(`Error at batch ${i / batchSize + 1}:`, error.message)
      process.exit(1)
    }

    inserted += batch.length
    console.log(`  Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} rows upserted`)
  }

  console.log(`\nDone. Seeded ${inserted} rows for ${houstonZips.length} ZIPs.`)
}

seedZips().catch(console.error)
