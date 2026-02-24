import { fetchSeatsForRole } from "./actions"
import { SeatsTable } from "./seats-table"

interface SeatsPageProps {
  searchParams: Promise<{ role?: string }>
}

export default async function SeatsPage({ searchParams }: SeatsPageProps) {
  const params = await searchParams
  const role = params.role ?? "agent"

  const data = await fetchSeatsForRole(role)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Seat Controls</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage seat caps and phantom fill counts per ZIP per role. Changes save immediately.
        </p>
      </div>

      <SeatsTable initialData={data} currentRole={role} />
    </div>
  )
}
