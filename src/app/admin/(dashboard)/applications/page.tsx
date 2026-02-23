import { createClient } from "@/lib/supabase/server"
import { ApplicationsDataTable } from "./data-table"

interface Props {
  searchParams: Promise<{
    status?: string
    page?: string
    search?: string
    role?: string
  }>
}

export default async function AdminApplicationsPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  const page = Math.max(1, parseInt(params.page ?? "1", 10))
  const pageSize = 25
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Build main query
  let query = supabase
    .from("applications")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  // Status filtering
  if (params.status === "partial") {
    query = query.lt("step_completed", 3).eq("status", "draft")
  } else if (
    params.status === "submitted" ||
    params.status === "approved" ||
    params.status === "rejected" ||
    params.status === "waitlisted"
  ) {
    query = query.eq("status", params.status).gte("step_completed", 3)
  } else {
    // Default: all non-draft applications
    query = query.neq("status", "draft")
  }

  // Search filtering
  if (params.search && params.search.trim()) {
    const escaped = params.search.trim().replace(/[%_]/g, "\\$&")
    query = query.or(`first_name.ilike.%${escaped}%,email.ilike.%${escaped}%`)
  }

  // Role filtering
  if (params.role && params.role !== "all") {
    query = query.eq("role", params.role)
  }

  const { data: applications, count } = await query

  // Status counts for tab badges
  const [submittedResult, approvedResult, rejectedResult, waitlistedResult, partialResult] =
    await Promise.all([
      supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "submitted")
        .gte("step_completed", 3),
      supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected"),
      supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "waitlisted"),
      supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft")
        .lt("step_completed", 3),
    ])

  const statusCounts = {
    submitted: submittedResult.count ?? 0,
    approved: approvedResult.count ?? 0,
    rejected: rejectedResult.count ?? 0,
    waitlisted: waitlistedResult.count ?? 0,
    partial: partialResult.count ?? 0,
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Applications</h2>
        <p className="text-gray-400 text-sm mt-1">
          Review and manage founding seat applications
        </p>
      </div>
      <ApplicationsDataTable
        data={(applications ?? []) as Parameters<typeof ApplicationsDataTable>[0]["data"]}
        totalCount={count ?? 0}
        page={page}
        pageSize={pageSize}
        statusCounts={statusCounts}
        currentStatus={params.status ?? "all"}
        currentSearch={params.search ?? ""}
        currentRole={params.role ?? ""}
      />
    </div>
  )
}
