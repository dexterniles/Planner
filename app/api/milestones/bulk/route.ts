import { db } from "@/lib/db";
import { milestones, projects } from "@/lib/db/schema";
import { bulkMilestonesSchema } from "@/lib/validations/milestone";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

// milestones has no userId column — tenant isolation is enforced by
// joining/sub-selecting through projects (project.userId = userId).
function toISODate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  const body = await request.json();
  const parsed = bulkMilestonesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { ids, action, days } = parsed.data;

  const count = await db.transaction(async (tx) => {
    // Resolve which of the requested ids actually belong to this user.
    const owned = await tx
      .select({
        id: milestones.id,
        targetDate: milestones.targetDate,
      })
      .from(milestones)
      .innerJoin(projects, eq(milestones.projectId, projects.id))
      .where(
        and(eq(projects.userId, userId), inArray(milestones.id, ids)),
      );
    const ownedIds = owned.map((r) => r.id);
    if (ownedIds.length === 0) return 0;

    if (action === "mark-done") {
      const updated = await tx
        .update(milestones)
        .set({ completedAt: new Date() })
        .where(inArray(milestones.id, ownedIds))
        .returning({ id: milestones.id });
      return updated.length;
    }

    if (action === "delete") {
      const deleted = await tx
        .delete(milestones)
        .where(inArray(milestones.id, ownedIds))
        .returning({ id: milestones.id });
      return deleted.length;
    }

    // reschedule: shift targetDate (date string YYYY-MM-DD) by `days`.
    // Skip rows with null targetDate.
    const shiftDays = days ?? 0;
    let modified = 0;
    for (const row of owned) {
      if (!row.targetDate) continue;
      // targetDate comes back as a YYYY-MM-DD string from drizzle's date type.
      // Parse as UTC midnight to avoid timezone drift.
      const [y, m, d] = row.targetDate.split("-").map((s) => parseInt(s, 10));
      const base = new Date(Date.UTC(y, m - 1, d));
      base.setUTCDate(base.getUTCDate() + shiftDays);
      const next = toISODate(base);
      const result = await tx
        .update(milestones)
        .set({ targetDate: next })
        .where(eq(milestones.id, row.id))
        .returning({ id: milestones.id });
      modified += result.length;
    }
    return modified;
  });

  return NextResponse.json({ count });
}
