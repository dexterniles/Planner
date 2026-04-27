import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getEventsByDate } from "@/lib/server/data/events";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "date parameter is required (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date must be in YYYY-MM-DD format" },
      { status: 400 },
    );
  }

  const [y, m, d] = date.split("-").map((n) => parseInt(n, 10));
  const dayStart = new Date(y, m - 1, d, 0, 0, 0);
  if (
    dayStart.getFullYear() !== y ||
    dayStart.getMonth() !== m - 1 ||
    dayStart.getDate() !== d
  ) {
    return NextResponse.json(
      { error: "Invalid date value" },
      { status: 400 },
    );
  }
  const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);

  const result = await getEventsByDate(auth.userId, { dayStart, dayEnd });
  return NextResponse.json(result);
}
