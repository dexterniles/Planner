import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getAllItems } from "@/lib/server/data/all-items";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const items = await getAllItems(auth.userId);
  return NextResponse.json(items);
}
