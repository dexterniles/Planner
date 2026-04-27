import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-auth";

async function handle(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL("/login", request.url);
  if (new URL(request.url).searchParams.has("forbidden")) {
    url.searchParams.set("forbidden", "1");
  }
  return NextResponse.redirect(url);
}

export const GET = handle;
export const POST = handle;
