import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

const startSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  zip_code: z.string().min(5, "ZIP code is required"),
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

  const result = startSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Please fill out all fields before continuing." },
      { status: 400 }
    );
  }

  const { first_name, email, phone, zip_code, role } = result.data;

  // Fire-and-forget insert to waitlist_interest (ignore duplicates)
  supabaseAdmin
    .from("waitlist_interest")
    .insert({ first_name, email, phone, zip_code, role })
    .then(({ error }) => {
      if (error && error.code !== "23505") {
        console.error("Waitlist insert error:", error);
      }
    });

  // Create draft application
  const sessionId = crypto.randomUUID();

  const { data, error } = await supabaseAdmin
    .from("applications")
    .insert({
      name: first_name,
      email,
      phone,
      role,
      primary_zip: zip_code,
      session_id: sessionId,
      step_completed: 1,
      step1_completed_at: new Date().toISOString(),
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    // Duplicate email+role (partial unique index)
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You already have an application for this role" },
        { status: 409 }
      );
    }
    console.error("Application insert error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    applicationId: data.id,
    sessionId,
  });
}
