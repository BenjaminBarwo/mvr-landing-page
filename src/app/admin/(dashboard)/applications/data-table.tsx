"use client"

import { useState, useCallback, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Application, columns } from "./columns"
import { ApplicationPanel } from "./application-panel"

interface StatusCounts {
  submitted: number
  approved: number
  rejected: number
  waitlisted: number
  partial: number
}

interface ApplicationsDataTableProps {
  data: Application[]
  totalCount: number
  page: number
  pageSize: number
  statusCounts: StatusCounts
  currentStatus: string
  currentSearch: string
  currentRole: string
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "partial", label: "Partial" },
] as const

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "agent", label: "Agent" },
  { value: "lender", label: "Lender" },
  { value: "inspector", label: "Inspector" },
  { value: "title_company", label: "Title Company" },
  { value: "appraiser", label: "Appraiser" },
  { value: "contractor", label: "Contractor" },
]

export function ApplicationsDataTable({
  data,
  totalCount,
  page,
  pageSize,
  statusCounts,
  currentStatus,
  currentSearch,
  currentRole,
}: ApplicationsDataTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [searchValue, setSearchValue] = useState(currentSearch)
  const [, startTransition] = useTransition()

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: totalCount,
    state: {
      pagination: { pageIndex: page - 1, pageSize },
    },
  })

  const buildUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams()
      if (currentStatus && currentStatus !== "all") params.set("status", currentStatus)
      if (currentSearch) params.set("search", currentSearch)
      if (currentRole && currentRole !== "all") params.set("role", currentRole)

      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === "" || val === "all") {
          params.delete(key)
        } else {
          params.set(key, val)
        }
      }

      const qs = params.toString()
      return qs ? `${pathname}?${qs}` : pathname
    },
    [pathname, currentStatus, currentSearch, currentRole]
  )

  function handleStatusChange(status: string) {
    router.push(buildUrl({ status, page: null }))
  }

  function handleSearchChange(value: string) {
    setSearchValue(value)
    const timer = setTimeout(() => {
      startTransition(() => {
        router.push(buildUrl({ search: value || null, page: null }))
      })
    }, 300)
    return () => clearTimeout(timer)
  }

  function handleRoleChange(role: string) {
    router.push(buildUrl({ role, page: null }))
  }

  function handlePrevPage() {
    if (page > 1) router.push(buildUrl({ page: String(page - 1) }))
  }

  function handleNextPage() {
    if (page < totalPages) router.push(buildUrl({ page: String(page + 1) }))
  }

  function getTabCount(tabValue: string): number | null {
    if (tabValue === "all") return null
    return statusCounts[tabValue as keyof StatusCounts] ?? null
  }

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-800 pb-0">
        {STATUS_TABS.map((tab) => {
          const count = getTabCount(tab.value)
          const isActive = currentStatus === tab.value || (tab.value === "all" && (!currentStatus || currentStatus === "all"))
          return (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-white text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
              {count !== null && (
                <Badge className="bg-gray-700 text-gray-200 border-transparent text-xs px-1.5 py-0">
                  {count}
                </Badge>
              )}
            </button>
          )
        })}
      </div>

      {/* Search + Role Filter */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by name or email..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
        />
        <Select
          value={currentRole || "all"}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-white">
            <SelectValue placeholder="All Roles" />
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
        <span className="text-sm text-gray-500 ml-auto">
          {totalCount} application{totalCount !== 1 ? "s" : ""}
        </span>
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
                  colSpan={columns.length}
                  className="h-24 text-center text-gray-500"
                >
                  No applications found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => setSelectedApp(row.original)}
                  className="cursor-pointer border-gray-800 hover:bg-gray-800/50 transition-colors"
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={page <= 1}
            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-40"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={page >= totalPages}
            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-40"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Slide-out Panel */}
      <Sheet open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <SheetContent
          side="right"
          className="w-[600px] sm:w-[700px] overflow-y-auto bg-gray-950 border-gray-800"
        >
          <SheetHeader className="border-b border-gray-800 pb-4">
            <SheetTitle className="text-white text-lg">
              {selectedApp?.name}
            </SheetTitle>
          </SheetHeader>
          {selectedApp && (
            <ApplicationPanel
              application={selectedApp}
              onClose={() => setSelectedApp(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
