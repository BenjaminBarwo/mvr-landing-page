import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const zip = request.nextUrl.searchParams.get("zip");
  const role = request.nextUrl.searchParams.get("role");

  if (!zip || !role) {
    return NextResponse.json(
      { error: "zip and role are required" },
      { status: 400 }
    );
  }

  // Look up seat data for this ZIP+role
  const { data: seatData, error: seatError } = await supabaseAdmin
    .from("zip_seats")
    .select("total_cap, phantom_count, tier, neighborhood")
    .eq("zip_code", zip)
    .eq("role", role)
    .single();

  if (seatError || !seatData) {
    // ZIP not in our coverage area
    return NextResponse.json({ inArea: false });
  }

  // Count non-draft, non-rejected applications for this ZIP+role
  const { count, error: countError } = await supabaseAdmin
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("primary_zip", zip)
    .eq("role", role)
    .not("status", "in", '("draft","rejected")');

  if (countError) {
    console.error("Seat count error:", countError);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }

  const taken = (count ?? 0) + seatData.phantom_count;
  const seatsRemaining = Math.max(0, seatData.total_cap - taken);

  return NextResponse.json({
    inArea: true,
    totalCap: seatData.total_cap,
    seatsRemaining,
    tier: seatData.tier,
    neighborhood: seatData.neighborhood,
  });
}
