"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export interface Application {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  primary_zip: string | null
  status: string
  stripe_payment_status: string | null
  step_completed: number
  created_at: string
  outreach_notes: string | null
  step1_completed_at: string | null
  step2_completed_at: string | null
  step3_completed_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  monthly_lead_spend: string | null
  leads_per_month: string | null
  transactions_closed: string | null
  buys_online_leads: boolean | null
  wtp_amount: string | null
  session_id: string | null
  paid_at: string | null
  payment_amount_cents: number | null
  admin_notes: string | null
}

function formatRole(role: string): string {
  if (role === "title_company") return "Title Company"
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, string> = {
    submitted: "bg-blue-600 text-white border-transparent",
    approved: "bg-green-600 text-white border-transparent",
    rejected: "bg-red-600 text-white border-transparent",
    waitlisted: "bg-yellow-600 text-white border-transparent",
    draft: "bg-gray-600 text-white border-transparent",
  }
  const className = variantMap[status] ?? "bg-gray-600 text-white border-transparent"
  return (
    <Badge className={className}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

function PaymentBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-500 text-xs">—</span>
  const classMap: Record<string, string> = {
    succeeded: "bg-green-600 text-white border-transparent",
    failed: "bg-red-600 text-white border-transparent",
    pending: "bg-gray-600 text-white border-transparent",
  }
  const className = classMap[status] ?? "bg-gray-600 text-white border-transparent"
  return <Badge className={className}>{status}</Badge>
}

export const columns: ColumnDef<Application>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium text-white">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-gray-300 text-sm">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-gray-400 text-sm">{row.original.phone ?? "—"}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <span className="text-gray-300 text-sm">{formatRole(row.original.role)}</span>
    ),
  },
  {
    accessorKey: "primary_zip",
    header: "ZIP",
    cell: ({ row }) => (
      <span className="text-gray-300 text-sm font-mono">
        {row.original.primary_zip ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "stripe_payment_status",
    header: "Payment",
    cell: ({ row }) => <PaymentBadge status={row.original.stripe_payment_status} />,
  },
  {
    accessorKey: "step_completed",
    header: "Step",
    cell: ({ row }) => {
      const step = row.original.step_completed
      if (step >= 3) return <span className="text-green-400 text-sm">Paid</span>
      return <span className="text-gray-400 text-sm">Step {step}/3</span>
    },
  },
  {
    accessorKey: "created_at",
    header: "Submitted",
    cell: ({ row }) => (
      <span className="text-gray-400 text-sm">{formatDate(row.original.created_at)}</span>
    ),
  },
]
