"use client"

import { useEffect, useRef, useState } from "react"
import { ColumnDef, Row, Table } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { ZipSeatRow } from "./actions"

// ─── Table meta type (for TypeScript awareness of custom meta) ────────────────

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData> {
    updateData: (id: string, field: string, value: number) => Promise<void>
  }
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  const classMap: Record<string, string> = {
    premium:  "bg-red-600 text-white border-transparent",
    standard: "bg-yellow-600 text-white border-transparent",
    suburban: "bg-green-600 text-white border-transparent",
  }
  const className = classMap[tier] ?? "bg-gray-600 text-white border-transparent"
  return (
    <Badge className={className}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </Badge>
  )
}

// ─── EditableNumberCell ───────────────────────────────────────────────────────
// Inline editable cell that saves on blur via table.options.meta.updateData

interface EditableNumberCellProps {
  value: number
  row: Row<ZipSeatRow>
  columnId: string
  table: Table<ZipSeatRow>
}

function EditableNumberCell({
  value: initialValue,
  row,
  columnId,
  table,
}: EditableNumberCellProps) {
  const [value, setValue] = useState(initialValue)
  const [isSaving, setIsSaving] = useState(false)
  const [flash, setFlash] = useState(false)
  const prevValueRef = useRef(initialValue)

  // Sync with external data changes (e.g. after server revalidation)
  useEffect(() => {
    setValue(initialValue)
    prevValueRef.current = initialValue
  }, [initialValue])

  async function handleBlur() {
    if (value === prevValueRef.current) return
    if (value < 0) {
      setValue(prevValueRef.current)
      return
    }

    setIsSaving(true)
    try {
      await table.options.meta?.updateData(row.original.id, columnId, value)
      prevValueRef.current = value
      setFlash(true)
      setTimeout(() => setFlash(false), 1500)
    } catch {
      // On error, revert to previous value
      setValue(prevValueRef.current)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className={`rounded transition-colors duration-300 ${
        flash ? "border border-green-500 bg-green-950/30" : "border border-transparent"
      }`}
    >
      <input
        type="number"
        value={value}
        min={0}
        disabled={isSaving}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={handleBlur}
        className={`w-20 rounded px-2 py-1 text-sm text-white bg-transparent border border-transparent
          hover:border-gray-600 focus:border-gray-500 focus:outline-none focus:bg-gray-800
          disabled:opacity-50 disabled:cursor-not-allowed
          [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
      />
    </div>
  )
}

// ─── Column definitions ───────────────────────────────────────────────────────

export const seatsColumns: ColumnDef<ZipSeatRow>[] = [
  {
    accessorKey: "zip_code",
    header: "ZIP Code",
    cell: ({ row }) => (
      <span className="font-mono text-white text-sm font-medium">
        {row.original.zip_code}
      </span>
    ),
  },
  {
    accessorKey: "tier",
    header: "Tier",
    cell: ({ row }) => <TierBadge tier={row.original.tier} />,
  },
  {
    accessorKey: "neighborhood",
    header: "Neighborhood",
    cell: ({ row }) => (
      <span className="text-gray-400 text-sm">
        {row.original.neighborhood ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "total_cap",
    header: "Seat Cap",
    cell: ({ row, column, table }) => (
      <EditableNumberCell
        value={row.original.total_cap}
        row={row}
        columnId={column.id}
        table={table}
      />
    ),
  },
  {
    accessorKey: "phantom_count",
    header: "Phantom Fill",
    cell: ({ row, column, table }) => (
      <EditableNumberCell
        value={row.original.phantom_count}
        row={row}
        columnId={column.id}
        table={table}
      />
    ),
  },
  {
    accessorKey: "claimed_count",
    header: "Real Fills",
    cell: ({ row }) => (
      <span className="text-gray-300 text-sm tabular-nums">
        {row.original.claimed_count}
      </span>
    ),
  },
  {
    id: "total_displayed",
    header: "Total Displayed",
    cell: ({ row }) => (
      <span className="text-gray-300 text-sm tabular-nums">
        {row.original.claimed_count + row.original.phantom_count}
      </span>
    ),
  },
  {
    id: "remaining",
    header: "Remaining",
    cell: ({ row }) => {
      const remaining =
        row.original.total_cap -
        row.original.claimed_count -
        row.original.phantom_count
      return (
        <span
          className={`text-sm tabular-nums font-medium ${
            remaining <= 0 ? "text-red-400" : "text-gray-300"
          }`}
        >
          {remaining}
        </span>
      )
    },
  },
]
