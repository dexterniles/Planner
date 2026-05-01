import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { bulkTasksSchema } from "@/lib/validations/task";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  const body = await request.json();
  const parsed = bulkTasksSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { ids, action, days } = parsed.data;

  const count = await db.transaction(async (tx) => {
    if (action === "mark-done") {
      // Skip cancelled — preserves the F1 single-click toggle's terminal-state semantic.
      const updated = await tx
        .update(tasks)
        .set({ status: "done" })
        .where(
          and(
            eq(tasks.userId, userId),
            inArray(tasks.id, ids),
            ne(tasks.status, "cancelled"),
          ),
        )
        .returning({ id: tasks.id });
      return updated.length;
    }

    if (action === "delete") {
      // Also delete direct subtasks of any selected parent so the
      // confirmation copy ("Subtasks will be removed too") doesn't lie.
      const deleted = await tx
        .delete(tasks)
        .where(
          and(
            eq(tasks.userId, userId),
            or(inArray(tasks.id, ids), inArray(tasks.parentTaskId, ids)),
          ),
        )
        .returning({ id: tasks.id });
      return deleted.length;
    }

    // reschedule: shift dueDate by `days`. Skip rows with null dueDate.
    const rows = await tx
      .select({ id: tasks.id, dueDate: tasks.dueDate })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), inArray(tasks.id, ids)));

    const shiftMs = (days ?? 0) * 24 * 60 * 60 * 1000;
    let modified = 0;
    for (const row of rows) {
      if (!row.dueDate) continue;
      const next = new Date(row.dueDate.getTime() + shiftMs);
      const result = await tx
        .update(tasks)
        .set({ dueDate: next })
        .where(and(eq(tasks.userId, userId), eq(tasks.id, row.id)))
        .returning({ id: tasks.id });
      modified += result.length;
    }
    return modified;
  });

  return NextResponse.json({ count });
}
