import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getActiveTimer } from "@/lib/server/data/time-logs";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const active = await getActiveTimer(auth.userId);
  return NextResponse.json(active);
}
