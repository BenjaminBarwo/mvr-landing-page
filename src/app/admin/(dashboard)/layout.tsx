import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from './actions'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Defense-in-depth: middleware already blocks unauthenticated access,
  // but we verify again here
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const role = (user.app_metadata?.role as string) ?? 'unknown'

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">MVR Admin</h1>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
            {role}
          </span>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </form>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
