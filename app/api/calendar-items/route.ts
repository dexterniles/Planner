import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import {
  getCalendarItemsMonth,
  getCalendarItemsRange,
} from "@/lib/server/data/calendar-items";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (from && to) {
    const items = await getCalendarItemsRange(auth.userId, from, to);
    return NextResponse.json(items);
  }
  if (month) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "month must be in YYYY-MM format" },
        { status: 400 },
      );
    }
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const mon = parseInt(monthStr, 10);
    if (Number.isNaN(year) || Number.isNaN(mon) || mon < 1 || mon > 12) {
      return NextResponse.json(
        { error: "Invalid month value" },
        { status: 400 },
      );
    }
    const items = await getCalendarItemsMonth(auth.userId, {
      year,
      month: mon,
    });
    return NextResponse.json(items);
  }
  return NextResponse.json(
    { error: "Provide either ?month=YYYY-MM or ?from=...&to=..." },
    { status: 400 },
  );
}
