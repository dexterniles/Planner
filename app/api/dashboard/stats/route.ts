import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getDashboardStats } from "@/lib/server/data/dashboard";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const stats = await getDashboardStats(auth.userId);
  return NextResponse.json(stats);
}
