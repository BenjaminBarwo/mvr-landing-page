import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

const waitlistSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  zip_code: z.string().min(1, "ZIP code is required"),
  role: z.enum([
    "agent",
    "lender",
    "inspector",
    "title_company",
    "appraiser",
    "contractor",
  ]),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = waitlistSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const { first_name, email, phone, zip_code, role } = result.data;

  const { error } = await supabaseAdmin
    .from("waitlist_interest")
    .insert({ first_name, email, phone, zip_code, role });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already on the waitlist for this role" },
        { status: 409 }
      );
    }
    console.error("Waitlist insert error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
