import { db } from "@/lib/db";
import { courses, SINGLE_USER_ID } from "@/lib/db/schema";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import {
  ensureSyllabusBucket,
  supabaseAdmin,
  SYLLABUS_BUCKET,
} from "@/lib/supabase/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
]);

async function getCourseOr404(id: string) {
  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.userId, SINGLE_USER_ID)));
  return course ?? null;
}

/** Returns a short-lived signed URL + metadata for the current syllabus. */
export async function GET(_request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;
  const course = await getCourseOr404(id);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (!course.syllabusFilePath) {
    return NextResponse.json({
      hasSyllabus: false,
      url: null,
      name: null,
      uploadedAt: null,
    });
  }

  const { data, error } = await supabaseAdmin.storage
    .from(SYLLABUS_BUCKET)
    .createSignedUrl(course.syllabusFilePath, 60 * 15); // 15 min
  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to create signed URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    hasSyllabus: true,
    url: data.signedUrl,
    name: course.syllabusName,
    uploadedAt: course.syllabusUploadedAt,
  });
}

/** Multipart upload — replaces any existing syllabus for the course. */
export async function POST(request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;
  const course = await getCourseOr404(id);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File exceeds 10MB limit" },
      { status: 413 },
    );
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}` },
      { status: 415 },
    );
  }

  await ensureSyllabusBucket();

  // If there was a previous syllabus, remove it first (best-effort).
  if (course.syllabusFilePath) {
    await supabaseAdmin.storage
      .from(SYLLABUS_BUCKET)
      .remove([course.syllabusFilePath]);
  }

  // Storage key: <userId>/<courseId>/<timestamp>-<safeName>
  const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "_");
  const key = `${SINGLE_USER_ID}/${id}/${Date.now()}-${safeName}`;

  const buffer = await file.arrayBuffer();
  const { error: uploadErr } = await supabaseAdmin.storage
    .from(SYLLABUS_BUCKET)
    .upload(key, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (uploadErr) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadErr.message}` },
      { status: 500 },
    );
  }

  const uploadedAt = new Date();
  await db
    .update(courses)
    .set({
      syllabusFilePath: key,
      syllabusName: file.name,
      syllabusUploadedAt: uploadedAt,
    })
    .where(and(eq(courses.id, id), eq(courses.userId, SINGLE_USER_ID)));

  return NextResponse.json({
    hasSyllabus: true,
    name: file.name,
    uploadedAt: uploadedAt.toISOString(),
  });
}

/** Delete the current syllabus and clear DB columns. */
export async function DELETE(_request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;
  const course = await getCourseOr404(id);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (!course.syllabusFilePath) {
    return NextResponse.json({ success: true });
  }

  await supabaseAdmin.storage
    .from(SYLLABUS_BUCKET)
    .remove([course.syllabusFilePath]);

  await db
    .update(courses)
    .set({
      syllabusFilePath: null,
      syllabusName: null,
      syllabusUploadedAt: null,
    })
    .where(and(eq(courses.id, id), eq(courses.userId, SINGLE_USER_ID)));

  return NextResponse.json({ success: true });
}
