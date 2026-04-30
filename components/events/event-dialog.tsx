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
import { STATUS_LABELS } from "./event-categories";
import { EventCategoryPicker } from "./event-category-picker";
import { RecurrencePicker } from "@/components/recurrence-picker";
import { toast } from "sonner";
import type { RecurrencePayload } from "@/lib/validations/recurrence";

interface EventPrefill {
  title?: string;
  startsAt?: string;
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: {
    id: string;
    title: string;
    description: string | null;
    categoryId: string | null;
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
  prefill?: EventPrefill;
  onCreated?: (event: { id: string }) => void;
}

function toLocalInput(iso: string | null | undefined, allDay: boolean): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
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

function formInputToISO(value: string, allDay: boolean): string {
  if (!value) return "";
  const local =
    allDay && !value.includes("T")
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  return local.toISOString();
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  prefill,
  onCreated,
}: EventDialogProps) {
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
      categoryId: null,
      startsAt: "",
      endsAt: "",
      allDay: false,
      location: "",
      url: "",
      attendees: "",
      status: "confirmed",
      color: "",
      recurrence: null,
    },
  });

  const allDay = watch("allDay");
  const currentCategoryId = watch("categoryId") ?? null;
  const currentStatus = watch("status") ?? "confirmed";
  const currentRecurrence = watch("recurrence") ?? null;

  useEffect(() => {
    const isAllDay = event?.allDay ?? false;
    const prefillStart = prefill?.startsAt
      ? toLocalInput(prefill.startsAt, isAllDay)
      : "";
    reset({
      title: event?.title ?? prefill?.title ?? "",
      description: event?.description ?? "",
      categoryId: event?.categoryId ?? null,
      startsAt: event?.startsAt
        ? toLocalInput(event.startsAt, isAllDay)
        : prefillStart
          ? prefillStart
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
      recurrence: null,
    });
  }, [event, open, prefill, reset]);

  const onSubmit = async (data: CreateEventInput) => {
    try {
      const startsAt = formInputToISO(data.startsAt ?? "", data.allDay ?? false);
      const endsAt = data.endsAt
        ? formInputToISO(data.endsAt, data.allDay ?? false)
        : null;

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
        const { recurrence: _r, ...updateData } = payload;
        await updateEvent.mutateAsync({ id: event.id, data: updateData });
        toast.success("Event updated");
      } else {
        const created = await createEvent.mutateAsync(payload);
        toast.success("Event created");
        if (onCreated) onCreated(created);
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
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Category picker — chips with inline +New */}
          <div className="space-y-2">
            <Label>Category</Label>
            <EventCategoryPicker
              value={currentCategoryId}
              onChange={(id) => setValue("categoryId", id)}
            />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {isEditing ? (
            <RecurrencePicker
              ownerType="event"
              ownerId={event.id}
              recurrenceRuleId={event.recurrenceRuleId}
            />
          ) : (
            <RecurrencePicker
              draft
              value={currentRecurrence as RecurrencePayload | null}
              onChange={(val) =>
                setValue("recurrence", val, { shouldDirty: true })
              }
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
