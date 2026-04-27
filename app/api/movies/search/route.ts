import { NextResponse } from "next/server";
import { tmdbSearchMulti } from "@/lib/tmdb/client";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const data = await tmdbSearchMulti(q);
    const results = data.results
      .filter((r) => r.media_type === "movie" || r.media_type === "tv")
      .slice(0, 12)
      .map((r) => {
        const title = r.title ?? r.name ?? "";
        const releaseDate = r.release_date ?? r.first_air_date ?? "";
        return {
          tmdbId: r.id,
          mediaType: r.media_type as "movie" | "tv",
          title,
          year: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
          posterPath: r.poster_path,
          overview: r.overview,
        };
      });
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "TMDB request failed" },
      { status: 502 },
    );
  }
}
