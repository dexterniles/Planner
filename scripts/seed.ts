import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { workspaces } from "../lib/db/schema";

// Next.js convention: secrets live in .env.local; fall back to .env.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const seedUserId = process.env.SEED_USER_ID;
  if (!seedUserId) {
    console.error(
      "SEED_USER_ID is not set — set it to the Supabase auth UUID of the user to seed for",
    );
    process.exit(1);
  }

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  console.log("Seeding database...");

  await db.insert(workspaces).values([
    {
      userId: seedUserId,
      name: "Academic",
      type: "academic",
      color: "#3B82F6",
      icon: "graduation-cap",
      sortOrder: 0,
    },
    {
      userId: seedUserId,
      name: "Projects",
      type: "projects",
      color: "#8B5CF6",
      icon: "folder-kanban",
      sortOrder: 1,
    },
  ]);

  console.log("Seeded 2 workspaces (Academic, Projects)");

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
