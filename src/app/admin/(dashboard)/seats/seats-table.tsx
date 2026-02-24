"use client"

import { useCallback, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { seatsColumns } from "./seats-columns"
import { updateZipSeat, bulkSetPhantomFill, resetCapsByTier, type ZipSeatRow } from "./actions"

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "agent",         label: "Agent" },
  { value: "lender",        label: "Lender" },
  { value: "inspector",     label: "Inspector" },
  { value: "title_company", label: "Title Company" },
  { value: "appraiser",     label: "Appraiser" },
  { value: "contractor",    label: "Contractor" },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface SeatsTableProps {
  initialData: ZipSeatRow[]
  currentRole: string
}

// ─── SeatsTable ───────────────────────────────────────────────────────────────

export function SeatsTable({ initialData, currentRole }: SeatsTableProps) {
  const router = useRouter()
  const [data, setData] = useState<ZipSeatRow[]>(initialData)
  const [, startTransition] = useTransition()

  // Bulk phantom fill state
  const [showPhantomForm, setShowPhantomForm] = useState(false)
  const [phantomValue, setPhantomValue] = useState(0)
  const [isApplyingPhantom, setIsApplyingPhantom] = useState(false)

  // Reset caps state
  const [isResettingCaps, setIsResettingCaps] = useState(false)

  // ─── updateData: called by EditableNumberCell on blur ────────────────────────
  const updateData = useCallback(
    async (id: string, field: string, value: number) => {
      if (field !== "total_cap" && field !== "phantom_count") {
        throw new Error(`Invalid field: ${field}`)
      }

      const result = await updateZipSeat({ id, field, value })
      if (result.error) {
        alert(`Save failed: ${result.error}`)
        throw new Error(result.error)
      }

      // Optimistic local state update
      setData((prev) =>
        prev.map((row) => {
          if (row.id !== id) return row
          const updated = { ...row, [field]: value }
          updated.total_displayed = updated.claimed_count + updated.phantom_count
          return updated
        })
      )
    },
    []
  )

  // ─── Table instance ───────────────────────────────────────────────────────────
  const table = useReactTable({
    data,
    columns: seatsColumns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData,
    },
  })

  // ─── Role change: navigate to ?role={role} ────────────────────────────────────
  function handleRoleChange(role: string) {
    startTransition(() => {
      router.push(`/admin/seats?role=${role}`)
    })
  }

  // ─── Bulk: Set phantom fill for all ZIPs in current role ─────────────────────
  async function handleApplyPhantomFill() {
    if (phantomValue < 0) return

    setIsApplyingPhantom(true)
    try {
      const result = await bulkSetPhantomFill({
        role: currentRole,
        phantomCount: phantomValue,
      })

      if (result.error) {
        alert(`Bulk phantom fill failed: ${result.error}`)
        return
      }

      // Update all rows locally
      setData((prev) =>
        prev.map((row) => ({
          ...row,
          phantom_count: phantomValue,
          total_displayed: row.claimed_count + phantomValue,
        }))
      )
      setShowPhantomForm(false)
      alert(
        `Set phantom fill to ${phantomValue} for ${result.updatedCount ?? data.length} ZIPs.`
      )
    } finally {
      setIsApplyingPhantom(false)
    }
  }

  // ─── Bulk: Reset caps to defaults by tier ─────────────────────────────────────
  async function handleResetCaps() {
    const confirmed = window.confirm(
      `Reset all seat caps for role "${currentRole}" to tier defaults? This cannot be undone.`
    )
    if (!confirmed) return

    setIsResettingCaps(true)
    try {
      const result = await resetCapsByTier({ role: currentRole })

      if (result.error) {
        alert(`Reset caps failed: ${result.error}`)
        return
      }

      // Refresh data from server
      startTransition(() => {
        router.refresh()
      })
    } finally {
      setIsResettingCaps(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Role selector + row count */}
      <div className="flex items-center gap-4">
        <Select value={currentRole} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-[200px] bg-gray-900 border-gray-700 text-white">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-white hover:bg-gray-800 focus:bg-gray-800"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-gray-500">
          {data.length} ZIP code{data.length !== 1 ? "s" : ""} for{" "}
          {ROLE_OPTIONS.find((o) => o.value === currentRole)?.label ?? currentRole}
        </span>
      </div>

      {/* Bulk actions toolbar */}
      <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-md border border-gray-800">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          Bulk Actions
        </span>

        {/* Set Phantom Fill */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPhantomForm((v) => !v)}
            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs"
          >
            Set Phantom Fill for All
          </Button>

          {showPhantomForm && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={phantomValue}
                onChange={(e) => setPhantomValue(Number(e.target.value))}
                className="w-20 rounded px-2 py-1 text-sm text-white bg-gray-800 border border-gray-600 focus:outline-none focus:border-gray-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <Button
                size="sm"
                onClick={handleApplyPhantomFill}
                disabled={isApplyingPhantom}
                className="bg-blue-700 hover:bg-blue-600 text-white text-xs disabled:opacity-50"
              >
                {isApplyingPhantom ? "Applying..." : "Apply"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPhantomForm(false)}
                className="bg-transparent border-gray-700 text-gray-400 hover:bg-gray-800 text-xs"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Reset Caps to Default */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetCaps}
          disabled={isResettingCaps}
          className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs disabled:opacity-50"
        >
          {isResettingCaps ? "Resetting..." : "Reset Caps to Default"}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border border-gray-800">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-gray-800 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-gray-400 bg-gray-900/50 h-10"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={seatsColumns.length}
                  className="h-24 text-center text-gray-500"
                >
                  No ZIP codes found for this role.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-gray-800 hover:bg-gray-800/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
