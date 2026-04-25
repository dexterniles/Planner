"use client";

import { useRef, useState } from "react";
import {
  ExternalLink,
  FileText,
  RefreshCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteSyllabus,
  useSyllabus,
  useUploadSyllabus,
} from "@/lib/hooks/use-syllabus";
import { toast } from "sonner";

interface SyllabusCardProps {
  courseId: string;
}

const MAX_BYTES = 10 * 1024 * 1024;

const ACCEPT_ATTR =
  ".pdf,.doc,.docx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";

function formatUploadedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SyllabusCard({ courseId }: SyllabusCardProps) {
  const { data, isLoading } = useSyllabus(courseId);
  const upload = useUploadSyllabus(courseId);
  const remove = useDeleteSyllabus(courseId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error("File exceeds 10MB limit");
      return;
    }
    try {
      await upload.mutateAsync(file);
      toast.success("Syllabus uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Remove the uploaded syllabus?")) return;
    try {
      await remove.mutateAsync();
      toast.success("Syllabus removed");
    } catch {
      toast.error("Failed to remove syllabus");
    }
  };

  const onSelectClick = () => fileInputRef.current?.click();

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  if (isLoading) {
    return <Skeleton className="h-[88px] w-full rounded-xl" />;
  }

  const busy = upload.isPending || remove.isPending;

  return (
    <Card className="p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={onInputChange}
      />

      {data?.hasSyllabus ? (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <FileText className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Syllabus
            </p>
            <p className="mt-0.5 truncate text-[14px] font-medium">
              {data.name ?? "Untitled"}
            </p>
            {data.uploadedAt && (
              <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
                Uploaded {formatUploadedAt(data.uploadedAt)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {data.url && (
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  View
                </Button>
              </a>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onSelectClick}
              disabled={busy}
              title="Replace"
              aria-label="Replace syllabus"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              disabled={busy}
              className="text-destructive"
              title="Remove"
              aria-label="Remove syllabus"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors sm:flex-row sm:gap-4 sm:py-4 ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20"
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Upload className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1 sm:text-left">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Syllabus
            </p>
            <p className="mt-0.5 text-[13px]">
              Drop a PDF here or browse · max 10MB
            </p>
          </div>
          <Button onClick={onSelectClick} disabled={busy} size="sm">
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {busy ? "Uploading…" : "Upload"}
          </Button>
        </div>
      )}
    </Card>
  );
}
