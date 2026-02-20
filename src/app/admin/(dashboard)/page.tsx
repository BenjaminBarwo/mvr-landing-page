import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const role = user?.app_metadata?.role as string
  const email = user?.email

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-md">
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-gray-400">Email</dt>
            <dd className="text-white">{email}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-400">Role</dt>
            <dd className="text-white capitalize">{role}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
