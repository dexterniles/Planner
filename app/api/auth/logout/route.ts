import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-auth";

async function handle(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL("/login", request.url);
  // If the middleware bounced an allowlist failure, surface that to the user.
  if (new URL(request.url).searchParams.has("forbidden")) {
    url.searchParams.set("forbidden", "1");
  }
  return NextResponse.redirect(url);
}

export const GET = handle;
export const POST = handle;
