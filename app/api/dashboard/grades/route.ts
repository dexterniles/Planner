import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getDashboardGrades } from "@/lib/server/data/dashboard";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const results = await getDashboardGrades(auth.userId);
  return NextResponse.json(results);
}
