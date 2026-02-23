"use client"

import { useEffect, useState, useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Application } from "./columns"
import {
  getApplicationDetail,
  updateApplicationStatus,
  addOutreachNote,
  type ApplicationDetail,
} from "./actions"

interface ApplicationPanelProps {
  application: Application
  onClose: () => void
}

function formatRole(role: string): string {
  if (role === "title_company") return "Title Company"
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function formatDateAbsolute(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusBadge({ status }: { status: string }) {
  const classMap: Record<string, string> = {
    submitted: "bg-blue-600 text-white border-transparent",
    approved: "bg-green-600 text-white border-transparent",
    rejected: "bg-red-600 text-white border-transparent",
    waitlisted: "bg-yellow-600 text-white border-transparent",
    draft: "bg-gray-600 text-white border-transparent",
  }
  return (
    <Badge className={classMap[status] ?? "bg-gray-600 text-white border-transparent"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
      {children}
    </h3>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-gray-800 last:border-0">
      <span className="text-gray-500 text-sm min-w-[140px]">{label}</span>
      <span className="text-gray-200 text-sm text-right">{value ?? "—"}</span>
    </div>
  )
}

// ─── Approve Dialog ──────────────────────────────────────────────────────────

function ApproveDialog({
  onConfirm,
  isPending,
}: {
  onConfirm: () => void
  isPending: boolean
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          disabled={isPending}
          className="bg-green-700 hover:bg-green-600 text-white border-0"
        >
          {isPending ? "Approving…" : "Approve"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Approve this application?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            This will mark the application as approved and send an approval email to the
            applicant.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-green-700 hover:bg-green-600 text-white"
          >
            Approve
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Reject Dialog ───────────────────────────────────────────────────────────

function RejectDialog({
  onConfirm,
  isPending,
}: {
  onConfirm: (reason: string) => void
  isPending: boolean
}) {
  const [reason, setReason] = useState("")
  const [touched, setTouched] = useState(false)
  const [open, setOpen] = useState(false)

  function handleConfirm() {
    setTouched(true)
    if (!reason.trim()) return
    onConfirm(reason.trim())
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          disabled={isPending}
          className="bg-red-700 hover:bg-red-600 text-white border-0"
        >
          {isPending ? "Rejecting…" : "Reject"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Reject this application?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            This will send a rejection email and initiate a $100 refund. Provide an internal
            reason (not shown to applicant).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Textarea
            placeholder="Internal rejection reason (required)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 min-h-[80px]"
          />
          {touched && !reason.trim() && (
            <p className="text-red-400 text-xs mt-1">Rejection reason is required.</p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            onClick={() => { setReason(""); setTouched(false) }}
          >
            Cancel
          </AlertDialogCancel>
          <Button
            size="default"
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-red-700 hover:bg-red-600 text-white"
          >
            Confirm Rejection
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Waitlist Dialog ──────────────────────────────────────────────────────────

function WaitlistDialog({
  onConfirm,
  isPending,
}: {
  onConfirm: () => void
  isPending: boolean
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          disabled={isPending}
          className="bg-yellow-700 hover:bg-yellow-600 text-white border-0"
        >
          {isPending ? "Waitlisting…" : "Waitlist"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Waitlist this application?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            This will send a waitlist notification email to the applicant.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-yellow-700 hover:bg-yellow-600 text-white"
          >
            Waitlist
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function ApplicationPanel({ application, onClose }: ApplicationPanelProps) {
  const [detail, setDetail] = useState<ApplicationDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)
  const [noteText, setNoteText] = useState("")
  const [noteSaved, setNoteSaved] = useState(false)

  useEffect(() => {
    setDetail(null)
    setLoadError(null)
    setActionError(null)
    setNoteText("")
    setNoteSaved(false)

    getApplicationDetail(application.id).then((result) => {
      if (result.error) {
        setLoadError(result.error)
      } else if (result.data) {
        setDetail(result.data)
        setNoteText(result.data.outreach_notes ?? "")
      }
    })
  }, [application.id])

  function handleStatusAction(status: "approved" | "rejected" | "waitlisted", reason?: string) {
    setActionError(null)
    startTransition(async () => {
      const result = await updateApplicationStatus({
        applicationId: application.id,
        status,
        reason,
      })
      if (result.error) {
        setActionError(result.error)
      } else {
        onClose()
      }
    })
  }

  function handleSaveNote() {
    setActionError(null)
    setNoteSaved(false)
    startTransition(async () => {
      const result = await addOutreachNote({
        applicationId: application.id,
        note: noteText,
      })
      if (result.error) {
        setActionError(result.error)
      } else {
        setNoteSaved(true)
      }
    })
  }

  // Loading skeleton
  if (!detail && !loadError) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 bg-gray-800 rounded w-full" />
        ))}
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-4 text-red-400 text-sm">
        Failed to load application details: {loadError}
      </div>
    )
  }

  const d = detail!
  const isPartial = d.step_completed < 3 && d.status === "draft"
  const isApprover = d.callerRole === "approver"

  // Seat availability
  const seatAvailability = (() => {
    if (d.total_cap === null) return null
    const phantom = d.phantom_count ?? 0
    const claimed = d.claimed_count ?? 0
    const remaining = Math.max(0, d.total_cap - phantom - claimed)
    return { total: d.total_cap, remaining }
  })()

  return (
    <div className="p-4 space-y-6 text-sm">
      {/* Error banner */}
      {actionError && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm px-3 py-2 rounded">
          {actionError}
        </div>
      )}

      {/* Section 1: Contact Information */}
      <section>
        <SectionTitle>Contact Information</SectionTitle>
        <div className="space-y-0">
          <DetailRow label="Name" value={d.name} />
          <DetailRow label="Email" value={d.email} />
          <DetailRow label="Phone" value={d.phone} />
          <DetailRow
            label="Role"
            value={
              <Badge className="bg-gray-700 text-gray-200 border-transparent text-xs">
                {formatRole(d.role)}
              </Badge>
            }
          />
          <DetailRow
            label="Primary ZIP"
            value={
              <span>
                <span className="font-mono">{d.primary_zip ?? "—"}</span>
                {seatAvailability && (
                  <span className="text-gray-500 ml-2">
                    — {seatAvailability.remaining} of {seatAvailability.total}{" "}
                    {formatRole(d.role)} seats remaining
                  </span>
                )}
              </span>
            }
          />
        </div>
      </section>

      {/* Section 2: Application Details */}
      <section>
        <SectionTitle>Application Details</SectionTitle>
        <div className="space-y-0">
          <DetailRow label="Status" value={<StatusBadge status={d.status} />} />
          <DetailRow
            label="Payment Status"
            value={
              d.stripe_payment_status ? (
                <Badge
                  className={
                    d.stripe_payment_status === "succeeded"
                      ? "bg-green-700 text-white border-transparent"
                      : d.stripe_payment_status === "failed"
                      ? "bg-red-700 text-white border-transparent"
                      : "bg-gray-600 text-white border-transparent"
                  }
                >
                  {d.stripe_payment_status}
                </Badge>
              ) : (
                "—"
              )
            }
          />
          <DetailRow
            label="Step Reached"
            value={d.step_completed >= 3 ? "Paid (3/3)" : `Step ${d.step_completed}/3`}
          />
          <DetailRow label="Started" value={formatDateAbsolute(d.created_at)} />
          <DetailRow label="Step 1 Completed" value={formatDateAbsolute(d.step1_completed_at)} />
          <DetailRow label="Step 2 Completed" value={formatDateAbsolute(d.step2_completed_at)} />
          <DetailRow label="Payment Completed" value={formatDateAbsolute(d.step3_completed_at ?? d.paid_at)} />
          {d.reviewed_at && (
            <DetailRow label="Reviewed" value={formatDateAbsolute(d.reviewed_at)} />
          )}
        </div>
      </section>

      {/* Section 3: Business Profile (only if step >= 2) */}
      {d.step_completed >= 2 && (
        <section>
          <SectionTitle>Business Profile</SectionTitle>
          <div className="space-y-0">
            <DetailRow label="Monthly Lead Spend" value={d.monthly_lead_spend} />
            <DetailRow label="Leads per Month" value={d.leads_per_month} />
            <DetailRow label="Transactions Closed" value={d.transactions_closed} />
            <DetailRow
              label="Buys Online Leads"
              value={d.buys_online_leads === null ? "—" : d.buys_online_leads ? "Yes" : "No"}
            />
            {d.wtp_amount && (
              <DetailRow label="WTP Amount" value={d.wtp_amount} />
            )}
          </div>
        </section>
      )}

      {/* Section 4: Status History Timeline */}
      <section>
        <SectionTitle>Status History</SectionTitle>
        {d.statusHistory.length === 0 ? (
          <p className="text-gray-600 text-sm">No status changes recorded.</p>
        ) : (
          <div className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-700" />
            <div className="space-y-4">
              {d.statusHistory.map((entry) => (
                <div key={entry.id} className="relative">
                  <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-gray-600 border-2 border-gray-900" />
                  <div className="text-gray-400 text-xs mb-0.5">
                    {formatDateAbsolute(entry.created_at)}
                  </div>
                  <div className="text-gray-200 text-sm">
                    {entry.changed_by ? (
                      <span className="text-gray-400">{entry.changed_by_email ?? entry.changed_by}</span>
                    ) : (
                      <span className="text-gray-500">System (payment webhook)</span>
                    )}
                    {" "}changed status{" "}
                    {entry.from_status ? (
                      <>
                        from{" "}
                        <StatusBadge status={entry.from_status} />{" "}
                        to{" "}
                        <StatusBadge status={entry.to_status} />
                      </>
                    ) : (
                      <>
                        to <StatusBadge status={entry.to_status} />
                      </>
                    )}
                  </div>
                  {entry.reason && (
                    <div className="text-gray-500 text-xs mt-0.5 italic">
                      Reason: {entry.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Section 5: Actions (approver only) */}
      {isApprover && (
        <section>
          <SectionTitle>Actions</SectionTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <ApproveDialog
              onConfirm={() => handleStatusAction("approved")}
              isPending={isPending}
            />
            <RejectDialog
              onConfirm={(reason) => handleStatusAction("rejected", reason)}
              isPending={isPending}
            />
            <WaitlistDialog
              onConfirm={() => handleStatusAction("waitlisted")}
              isPending={isPending}
            />
          </div>
        </section>
      )}

      {/* Section 6: Outreach Notes (partial applications only) */}
      {isPartial && (
        <section>
          <SectionTitle>Outreach Notes</SectionTitle>
          {isApprover ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Add internal outreach notes..."
                value={noteText}
                onChange={(e) => {
                  setNoteText(e.target.value)
                  setNoteSaved(false)
                }}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 min-h-[80px]"
                disabled={isPending}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={isPending || !noteText.trim()}
                  className="bg-gray-700 hover:bg-gray-600 text-white border-0"
                >
                  {isPending ? "Saving…" : "Save Note"}
                </Button>
                {noteSaved && (
                  <span className="text-green-400 text-xs">Saved.</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              {d.outreach_notes ?? "No notes."}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
