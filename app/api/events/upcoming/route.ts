import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getUpcomingEvents } from "@/lib/server/data/events";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);

  const result = await getUpcomingEvents(auth.userId, limit);
  return NextResponse.json(result);
}
