import postgres from "postgres";

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });

  await client.unsafe(`
    CREATE OR REPLACE VIEW calendar_items AS
    SELECT
      'assignment' AS source_type,
      a.id AS source_id,
      a.user_id,
      c.workspace_id,
      a.title,
      a.due_date,
      a.status::text AS status,
      c.color
    FROM assignments a
    INNER JOIN courses c ON a.course_id = c.id
    UNION ALL
    SELECT
      'task' AS source_type,
      t.id AS source_id,
      t.user_id,
      p.workspace_id,
      t.title,
      t.due_date,
      t.status::text AS status,
      p.color
    FROM tasks t
    INNER JOIN projects p ON t.project_id = p.id
    UNION ALL
    SELECT
      'milestone' AS source_type,
      m.id AS source_id,
      p.user_id,
      p.workspace_id,
      m.title,
      m.target_date::timestamptz AS due_date,
      CASE WHEN m.completed_at IS NOT NULL THEN 'done' ELSE 'pending' END AS status,
      p.color
    FROM milestones m
    INNER JOIN projects p ON m.project_id = p.id
  `);

  console.log("calendar_items view created");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
