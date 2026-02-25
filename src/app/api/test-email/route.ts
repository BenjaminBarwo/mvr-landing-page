import { NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import { createElement } from 'react'
import { ConfirmationEmail } from '@/components/emails/ConfirmationEmail'
import { ApprovalEmail } from '@/components/emails/ApprovalEmail'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const template = url.searchParams.get('template') || 'confirmation'

  try {
    const react =
      template === 'approval'
        ? createElement(ApprovalEmail, {
            firstName: 'Ben',
            role: 'agent',
            zip: '77070',
          })
        : createElement(ConfirmationEmail, {
            firstName: 'Ben',
            role: 'agent',
            zip: '77070',
            amountPaid: '$100',
          })

    const result = await resend.emails.send({
      from: 'MVR Team <team@mvrfounding.com>',
      to: ['bbarwo12@gmail.com'],
      replyTo: 'support@mvrfounding.com',
      subject: `[TEST] ${template} template`,
      react,
    })

    return NextResponse.json({
      success: !result.error,
      data: result.data,
      error: result.error,
      template,
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
      message: err instanceof Error ? err.message : undefined,
      template,
    })
  }
}
