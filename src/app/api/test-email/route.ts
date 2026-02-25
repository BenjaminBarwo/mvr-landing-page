import { NextResponse } from 'next/server'
import { resend } from '@/lib/resend'

export async function GET() {
  try {
    const result = await resend.emails.send({
      from: 'MVR Team <team@mvrfounding.com>',
      to: ['bbarwo12@gmail.com'],
      subject: 'Diagnostic Test — MVR Email Pipeline',
      html: '<p>If you see this, Resend is working from the app code.</p>',
    })

    return NextResponse.json({
      success: !result.error,
      data: result.data,
      error: result.error,
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
  }
}
