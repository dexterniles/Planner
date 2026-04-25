"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  CalendarDays,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from "@/lib/hooks/use-notes";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface NotesListProps {
  parentType: "course" | "project" | "assignment" | "task" | "event";
  parentId: string;
  /** Show session date field (useful for courses, to tag a note to a specific class) */
  showSessionDate?: boolean;
}

interface Note {
  id: string;
  title: string | null;
  content: string | null;
  sessionDate: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function formatUpdated(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function NotesList({
  parentType,
  parentId,
  showSessionDate = false,
}: NotesListProps) {
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftSessionDate, setDraftSessionDate] = useState("");

  const { data: notes, isLoading } = useNotes(parentType, parentId);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const confirm = useConfirm();

  const resetDraft = () => {
    setDraftTitle("");
    setDraftContent("");
    setDraftSessionDate("");
  };

  const startCompose = () => {
    resetDraft();
    setEditingId(null);
    setComposing(true);
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setComposing(false);
    setDraftTitle(note.title ?? "");
    setDraftContent(note.content ?? "");
    setDraftSessionDate(note.sessionDate ?? "");
  };

  const cancel = () => {
    setComposing(false);
    setEditingId(null);
    resetDraft();
  };

  const save = async () => {
    if (!draftContent.trim() && !draftTitle.trim()) {
      toast.error("Add a title or some content first");
      return;
    }
    try {
      if (editingId) {
        await updateNote.mutateAsync({
          id: editingId,
          data: {
            title: draftTitle.trim() || null,
            content: draftContent.trim() || null,
            sessionDate: draftSessionDate || null,
          },
        });
        toast.success("Note updated");
      } else {
        await createNote.mutateAsync({
          parentType,
          parentId,
          title: draftTitle.trim() || null,
          content: draftContent.trim() || null,
          sessionDate: draftSessionDate || null,
        });
        toast.success("Note saved");
      }
      cancel();
    } catch {
      toast.error("Failed to save note");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        title: "Delete this note?",
        destructive: true,
      }))
    ) {
      return;
    }
    try {
      await deleteNote.mutateAsync(id);
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  const editor = (
    <div className="space-y-3">
      <Input
        value={draftTitle}
        onChange={(e) => setDraftTitle(e.target.value)}
        placeholder="Title (optional)"
        className="font-medium"
      />
      {showSessionDate && (
        <div className="space-y-1.5">
          <Label htmlFor="session-date" className="text-xs">
            Session date (optional)
          </Label>
          <Input
            id="session-date"
            type="date"
            value={draftSessionDate}
            onChange={(e) => setDraftSessionDate(e.target.value)}
          />
        </div>
      )}
      <Textarea
        value={draftContent}
        onChange={(e) => setDraftContent(e.target.value)}
        placeholder="Write your note..."
        rows={6}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={cancel}>
          <X className="mr-1.5 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={save}
          disabled={createNote.isPending || updateNote.isPending}
        >
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {createNote.isPending || updateNote.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-[20px] font-medium leading-tight tracking-tight">Notes</h3>
        {!composing && !editingId && (
          <Button size="sm" onClick={startCompose}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Note
          </Button>
        )}
      </div>

      {composing && (
        <Card className="p-4 mb-4">
          {editor}
        </Card>
      )}

      {!notes || notes.length === 0 ? (
        !composing && (
          <div className="text-center py-8">
            <StickyNote className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No notes yet. Write your first one to capture thoughts.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {notes.map((note: Note) =>
            editingId === note.id ? (
              <Card key={note.id} className="p-4">
                {editor}
              </Card>
            ) : (
              <Card key={note.id} className="group p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    {note.title && (
                      <h4 className="font-medium truncate">{note.title}</h4>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {note.sessionDate && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatSessionDate(note.sessionDate)}
                        </span>
                      )}
                      <span>Updated {formatUpdated(note.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => startEdit(note)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {note.content && (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                    {note.content}
                  </p>
                )}
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  );
}
