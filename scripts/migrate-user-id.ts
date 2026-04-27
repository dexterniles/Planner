/**
 * One-time migration: rewrite every row's `user_id` from the legacy
 * SINGLE_USER_ID constant to the real Supabase auth UUID.
 *
 * Why: yesterday's auth refactor switched routes from filtering by a hardcoded
 * constant to filtering by the JWT-resolved auth user id. Existing data was
 * inserted with the old constant, so authenticated queries return zero rows.
 *
 * Usage:
 *   npx tsx scripts/migrate-user-id.ts --dry-run
 *   npx tsx scripts/migrate-user-id.ts
 *
 * Required env: DATABASE_URL, ALLOWED_ADMIN_EMAIL.
 *
 * Safety: wraps every UPDATE in a single transaction; runs a sanity check
 * before COMMIT to confirm no rows still reference the old UUID; ROLLBACK on
 * any failure. Dry-run mode runs SELECT COUNT(*) per table and ROLLBACKs.
 */

import { config as loadEnv } from "dotenv";
import postgres from "postgres";

// Next.js convention: secrets live in .env.local; fall back to .env.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const OLD_USER_ID = "00000000-0000-0000-0000-000000000001";

// Tables with a `user_id` column, derived from lib/db/schema.ts.
// Includes every pgTable whose definition contains `userId: uuid("user_id")`.
const TABLES_WITH_USER_ID = [
  "workspaces",
  "courses",
  "assignments",
  "projects",
  "tasks",
  "event_categories",
  "events",
  "bill_categories",
  "bills",
  "pay_schedule",
  "notes",
  "resources",
  "tags",
  "inbox_items",
  "time_logs",
  "media_items",
  "recipes",
] as const;

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) fail("DATABASE_URL is not set");

  const adminEmail = process.env.ALLOWED_ADMIN_EMAIL;
  if (!adminEmail) fail("ALLOWED_ADMIN_EMAIL is not set");

  const client = postgres(databaseUrl, { prepare: false });

  try {
    // 1. Resolve the target UUID from auth.users.
    const authRows = await client<{ id: string }[]>`
      SELECT id FROM auth.users WHERE email = ${adminEmail}
    `;
    if (authRows.length === 0) {
      fail(`No auth.users row found for email ${adminEmail}`);
    }
    if (authRows.length > 1) {
      fail(`Multiple auth.users rows for email ${adminEmail} (got ${authRows.length})`);
    }
    const NEW_USER_ID = authRows[0].id;

    if (NEW_USER_ID === OLD_USER_ID) {
      fail(`Resolved UUID equals OLD_USER_ID — nothing to do (and likely a bug)`);
    }

    console.log(`mode:        ${dryRun ? "DRY RUN" : "LIVE"}`);
    console.log(`old user id: ${OLD_USER_ID}`);
    console.log(`new user id: ${NEW_USER_ID}`);
    console.log(`tables:      ${TABLES_WITH_USER_ID.length}`);
    console.log("");

    // 2. Run inside a transaction.
    let totalTouched = 0;
    await client.begin(async (tx) => {
      if (dryRun) {
        for (const table of TABLES_WITH_USER_ID) {
          const rows = await tx.unsafe<{ count: string }[]>(
            `SELECT COUNT(*)::text AS count FROM ${table} WHERE user_id = $1`,
            [OLD_USER_ID],
          );
          const n = Number(rows[0].count);
          totalTouched += n;
          console.log(`  ${table.padEnd(22)} ${n} rows would be updated`);
        }
        // Force ROLLBACK by throwing a sentinel.
        throw new Error("__DRY_RUN_ROLLBACK__");
      }

      // Live update path.
      for (const table of TABLES_WITH_USER_ID) {
        const result = await tx.unsafe(
          `UPDATE ${table} SET user_id = $1 WHERE user_id = $2`,
          [NEW_USER_ID, OLD_USER_ID],
        );
        const n = result.count ?? 0;
        totalTouched += n;
        console.log(`  ${table.padEnd(22)} ${n} rows updated`);
      }

      // Sanity check: make sure no rows still reference the old UUID.
      const stragglers: { table: string; count: number }[] = [];
      for (const table of TABLES_WITH_USER_ID) {
        const rows = await tx.unsafe<{ count: string }[]>(
          `SELECT COUNT(*)::text AS count FROM ${table} WHERE user_id = $1`,
          [OLD_USER_ID],
        );
        const n = Number(rows[0].count);
        if (n > 0) stragglers.push({ table, count: n });
      }
      if (stragglers.length > 0) {
        console.error("\n✗ Sanity check failed — rows still reference OLD_USER_ID:");
        for (const s of stragglers) console.error(`    ${s.table}: ${s.count}`);
        // Throw to ROLLBACK.
        throw new Error("sanity check failed: stragglers found");
      }
    }).catch((err) => {
      if (err instanceof Error && err.message === "__DRY_RUN_ROLLBACK__") {
        // Expected in dry-run; swallow.
        return;
      }
      throw err;
    });

    console.log("");
    console.log(`total rows ${dryRun ? "would be touched" : "touched"}: ${totalTouched}`);
    console.log(`target uuid: ${NEW_USER_ID}`);
    console.log(`old uuid:    ${OLD_USER_ID}`);
    console.log(dryRun ? "✓ dry run complete (transaction rolled back)" : "✓ migration committed");
  } finally {
    await client.end({ timeout: 5 });
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ migration failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
