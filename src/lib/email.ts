import { resend } from './resend'
import { supabaseAdmin } from './supabase/admin'
import { ConfirmationEmail } from '@/components/emails/ConfirmationEmail'
import { ApprovalEmail } from '@/components/emails/ApprovalEmail'
import { RejectionEmail } from '@/components/emails/RejectionEmail'
import { WaitlistEmail } from '@/components/emails/WaitlistEmail'
import { WaitlistApprovedEmail } from '@/components/emails/WaitlistApprovedEmail'
import { createElement } from 'react'

export type EmailType =
  | 'confirmation'
  | 'approved'
  | 'rejected'
  | 'waitlisted'
  | 'waitlist_approved'

interface ApplicationData {
  firstName: string
  email: string
  role: string
  primary_zip: string
  amountPaid?: string
}

interface SendEmailParams {
  applicationId: string
  emailType: EmailType
  application: ApplicationData
}

interface SendEmailResult {
  data?: { id: string } | null
  error?: unknown
  skipped?: boolean
}

function getEmailConfig(
  emailType: EmailType,
  application: ApplicationData
): { subject: string; react: React.ReactElement } {
  const { firstName, role, primary_zip, amountPaid = '$100' } = application

  switch (emailType) {
    case 'confirmation':
      return {
        subject: 'Application Received — MVR Founding Seat',
        react: createElement(ConfirmationEmail, { firstName, role, zip: primary_zip, amountPaid }),
      }
    case 'approved':
      return {
        subject: "You've Secured Your Founding Seat — MVR",
        react: createElement(ApprovalEmail, { firstName, role, zip: primary_zip }),
      }
    case 'rejected':
      return {
        subject: 'Update on Your MVR Application',
        react: createElement(RejectionEmail, { firstName, role }),
      }
    case 'waitlisted':
      return {
        subject: "You're on the Waitlist — MVR Founding Seat",
        react: createElement(WaitlistEmail, { firstName, role, zip: primary_zip }),
      }
    case 'waitlist_approved':
      return {
        subject: 'Great News — A Seat Has Opened! — MVR',
        react: createElement(WaitlistApprovedEmail, { firstName, role, zip: primary_zip }),
      }
  }
}

export async function sendEmail({
  applicationId,
  emailType,
  application,
}: SendEmailParams): Promise<SendEmailResult> {
  // De-duplication: check email_log for existing successful send
  // Exception: waitlist_approved is always sent (distinct template for seat-opened event)
  if (emailType !== 'waitlist_approved') {
    const { data: existing } = await supabaseAdmin
      .from('email_log')
      .select('id')
      .eq('application_id', applicationId)
      .eq('email_type', emailType)
      .eq('status', 'sent')
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`[email] Skipping duplicate send: ${emailType} for application ${applicationId}`)
      return { skipped: true }
    }
  }

  const { subject, react } = getEmailConfig(emailType, application)

  let emailData: { id: string } | null = null
  let emailError: unknown = null
  let status: 'sent' | 'failed' = 'failed'
  let providerMessageId: string | null = null

  try {
    const result = await resend.emails.send(
      {
        from: 'MVR Team <team@mvrfounding.com>',
        to: [application.email],
        replyTo: 'support@mvrfounding.com',
        subject,
        react,
      },
      {
        idempotencyKey: `${emailType}/${applicationId}`,
      }
    )

    if (result.error) {
      emailError = result.error
      console.error(`[email] Resend error for ${emailType}/${applicationId}:`, result.error)
    } else {
      emailData = result.data
      status = 'sent'
      providerMessageId = result.data?.id ?? null
      console.log(`[email] Sent ${emailType} for application ${applicationId} (msgId: ${providerMessageId})`)
    }
  } catch (err) {
    emailError = err
    console.error(`[email] Exception sending ${emailType} for application ${applicationId}:`, err)
  }

  // Audit log — always insert regardless of success/failure
  const { error: logError } = await supabaseAdmin.from('email_log').insert({
    application_id: applicationId,
    email_type: emailType,
    provider_message_id: providerMessageId,
    status,
  })

  if (logError) {
    console.error(`[email] Failed to write email_log for ${emailType}/${applicationId}:`, logError)
  }

  return { data: emailData, error: emailError }
}
