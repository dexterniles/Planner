import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service-role key. Bypasses RLS, so
 * never expose this to the browser. Use for storage uploads/deletes and any
 * privileged data access from API routes.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

export const SYLLABUS_BUCKET = "syllabi";

/** Idempotently ensure the syllabus storage bucket exists (private). */
export async function ensureSyllabusBucket(): Promise<void> {
  const { data, error } = await supabaseAdmin.storage.getBucket(SYLLABUS_BUCKET);
  if (data) return;
  // 404 → create. Other errors are surfaced.
  if (error && !error.message.toLowerCase().includes("not found")) {
    throw error;
  }
  const { error: createErr } = await supabaseAdmin.storage.createBucket(
    SYLLABUS_BUCKET,
    {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
      ],
    },
  );
  if (createErr && !createErr.message.toLowerCase().includes("already exists")) {
    throw createErr;
  }
}
