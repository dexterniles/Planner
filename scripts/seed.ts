import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { workspaces, SINGLE_USER_ID } from "../lib/db/schema";

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client);

  console.log("Seeding database...");

  await db.insert(workspaces).values([
    {
      userId: SINGLE_USER_ID,
      name: "Academic",
      type: "academic",
      color: "#3B82F6",
      icon: "graduation-cap",
      sortOrder: 0,
    },
    {
      userId: SINGLE_USER_ID,
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
