"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEventSchema,
  type CreateEventInput,
  eventStatusValues,
} from "@/lib/validations/event";
import { useCreateEvent, useUpdateEvent } from "@/lib/hooks/use-events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LIST,
  STATUS_LABELS,
} from "./event-categories";
import { RecurrencePicker } from "@/components/recurrence-picker";
import { toast } from "sonner";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: {
    id: string;
    title: string;
    description: string | null;
    category: CreateEventInput["category"];
    startsAt: string;
    endsAt: string | null;
    allDay: boolean;
    location: string | null;
    url: string | null;
    attendees: string | null;
    status: CreateEventInput["status"];
    color: string | null;
    recurrenceRuleId: string | null;
  };
}

function toLocalInput(iso: string | null | undefined, allDay: boolean): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  // Convert to local-ISO for datetime-local/date input
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  if (allDay) return `${yyyy}-${mm}-${dd}`;
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

/** Today at 23:59 local, formatted for datetime-local input. */
function defaultEventStart(): string {
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
}

export function EventDialog({ open, onOpenChange, event }: EventDialogProps) {
  const isEditing = !!event;
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "other",
      startsAt: "",
      endsAt: "",
      allDay: false,
      location: "",
      url: "",
      attendees: "",
      status: "confirmed",
      color: "",
    },
  });

  const allDay = watch("allDay");
  const currentCategory = watch("category") ?? "other";
  const currentStatus = watch("status") ?? "confirmed";

  useEffect(() => {
    const isAllDay = event?.allDay ?? false;
    reset({
      title: event?.title ?? "",
      description: event?.description ?? "",
      category: event?.category ?? "other",
      startsAt: event?.startsAt
        ? toLocalInput(event.startsAt, isAllDay)
        : isAllDay
          ? ""
          : defaultEventStart(),
      endsAt: event?.endsAt ? toLocalInput(event.endsAt, isAllDay) : "",
      allDay: isAllDay,
      location: event?.location ?? "",
      url: event?.url ?? "",
      attendees: event?.attendees ?? "",
      status: event?.status ?? "confirmed",
      color: event?.color ?? "",
    });
  }, [event, open, reset]);

  const onSubmit = async (data: CreateEventInput) => {
    try {
      // Convert local datetime-input strings to ISO
      const startsAt = data.startsAt
        ? new Date(data.startsAt).toISOString()
        : "";
      const endsAt = data.endsAt ? new Date(data.endsAt).toISOString() : null;

      const payload = {
        ...data,
        startsAt,
        endsAt,
        description: data.description?.trim() || null,
        location: data.location?.trim() || null,
        url: data.url?.trim() || null,
        attendees: data.attendees?.trim() || null,
        color: data.color?.trim() || null,
      };

      if (isEditing) {
        await updateEvent.mutateAsync({ id: event.id, data: payload });
        toast.success("Event updated");
      } else {
        await createEvent.mutateAsync(payload);
        toast.success("Event created");
      }
      onOpenChange(false);
      reset();
    } catch {
      toast.error(isEditing ? "Failed to update event" : "Failed to create event");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Event" : "New Event"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g. Dinner with Alex"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Category picker — icon grid */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_CATEGORY_LIST.map((cat) => {
                const Icon = cat.icon;
                const active = currentCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setValue("category", cat.value)}
                    className={`group flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-all ${
                      active
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                        : "border-border hover:bg-accent hover:border-border/80"
                    }`}
                    aria-label={cat.label}
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br ${cat.gradient}`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${cat.text}`} />
                    </div>
                    <span
                      className={
                        active ? "font-medium" : "text-muted-foreground"
                      }
                    >
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* All-day toggle */}
          <div className="flex items-center gap-2">
            <input
              id="allDay"
              type="checkbox"
              {...register("allDay")}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <Label htmlFor="allDay" className="text-sm cursor-pointer">
              All-day event
            </Label>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startsAt">Starts *</Label>
              <Input
                id="startsAt"
                type={allDay ? "date" : "datetime-local"}
                {...register("startsAt")}
              />
              {errors.startsAt && (
                <p className="text-sm text-destructive">
                  {errors.startsAt.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endsAt">Ends</Label>
              <Input
                id="endsAt"
                type={allDay ? "date" : "datetime-local"}
                {...register("endsAt")}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="e.g. 24 Carrots Bistro"
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Link</Label>
            <Input
              id="url"
              {...register("url")}
              placeholder="Ticket, reservation, or map link"
            />
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label htmlFor="attendees">With</Label>
            <Input
              id="attendees"
              {...register("attendees")}
              placeholder="e.g. Alex, Sarah"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={currentStatus}
              onValueChange={(val) =>
                setValue("status", val as CreateEventInput["status"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) =>
                    STATUS_LABELS[value as keyof typeof STATUS_LABELS] ?? value
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {eventStatusValues.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Anything worth remembering..."
              rows={2}
            />
          </div>

          {/* Recurrence picker — only when editing (needs an id) */}
          {isEditing && (
            <RecurrencePicker
              ownerType="event"
              ownerId={event.id}
              recurrenceRuleId={event.recurrenceRuleId}
            />
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={createEvent.isPending || updateEvent.isPending}
            >
              {createEvent.isPending || updateEvent.isPending
                ? "Saving..."
                : isEditing
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
