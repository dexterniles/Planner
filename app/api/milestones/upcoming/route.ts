import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getUpcomingMilestones } from "@/lib/server/data/milestones";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "3", 10);

  const result = await getUpcomingMilestones(auth.userId, limit);
  return NextResponse.json(result);
}
