import { requireAuthGuard } from "@/lib/auth/require-auth";
import { NextResponse } from "next/server";
import { getSearch } from "@/lib/server/data/search";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = await getSearch(auth.userId, q);
  return NextResponse.json(results);
}
