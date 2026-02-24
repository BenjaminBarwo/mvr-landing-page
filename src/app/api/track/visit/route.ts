import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

interface VisitBody {
  path?: string
  session_id?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

function hashIp(ip: string): string {
  // Simple non-cryptographic hash for deduplication (not PII-grade)
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit int
  }
  return `h_${Math.abs(hash).toString(36)}`
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: VisitBody = await request.json()

    // Extract IP from headers for deduplication hash
    const forwarded = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const rawIp = forwarded?.split(",")[0]?.trim() ?? realIp ?? "unknown"
    const ip_hash = hashIp(rawIp)

    const { error } = await supabaseAdmin.from("page_visits").insert({
      path: body.path ?? "/",
      session_id: body.session_id ?? null,
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
      ip_hash,
    })

    if (error) {
      console.error("[track/visit] Insert error:", error)
      return NextResponse.json({ received: false, error: "DB error" }, { status: 500 })
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    // Non-critical — tracking should not break the page
    console.error("[track/visit] Unexpected error:", err)
    return NextResponse.json({ received: false, error: "Server error" }, { status: 500 })
  }
}
