import { db } from "@/lib/db";
import { assignments } from "@/lib/db/schema";
import { bulkAssignmentsSchema } from "@/lib/validations/assignment";
import { and, eq, inArray, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  const body = await request.json();
  const parsed = bulkAssignmentsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { ids, action, days } = parsed.data;

  const count = await db.transaction(async (tx) => {
    if (action === "mark-done") {
      // Skip graded — preserves the F1 single-click toggle's terminal-state semantic.
      const updated = await tx
        .update(assignments)
        .set({ status: "submitted" })
        .where(
          and(
            eq(assignments.userId, userId),
            inArray(assignments.id, ids),
            ne(assignments.status, "graded"),
          ),
        )
        .returning({ id: assignments.id });
      return updated.length;
    }

    if (action === "delete") {
      const deleted = await tx
        .delete(assignments)
        .where(
          and(eq(assignments.userId, userId), inArray(assignments.id, ids)),
        )
        .returning({ id: assignments.id });
      return deleted.length;
    }

    // reschedule: shift dueDate by `days`. Skip rows with null dueDate.
    const rows = await tx
      .select({ id: assignments.id, dueDate: assignments.dueDate })
      .from(assignments)
      .where(
        and(eq(assignments.userId, userId), inArray(assignments.id, ids)),
      );

    const shiftMs = (days ?? 0) * 24 * 60 * 60 * 1000;
    let modified = 0;
    for (const row of rows) {
      if (!row.dueDate) continue;
      const next = new Date(row.dueDate.getTime() + shiftMs);
      const result = await tx
        .update(assignments)
        .set({ dueDate: next })
        .where(
          and(eq(assignments.userId, userId), eq(assignments.id, row.id)),
        )
        .returning({ id: assignments.id });
      modified += result.length;
    }
    return modified;
  });

  return NextResponse.json({ count });
}
