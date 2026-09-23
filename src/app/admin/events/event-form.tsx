"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, Eye, LoaderCircle } from "lucide-react";
import type { EventActionState } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

type EventValues = {
  title: string;
  description: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  visibility: "public" | "unlisted";
  status: "draft" | "published" | "cancelled";
};

const initialState: EventActionState = {};

export function EventForm({
  event,
  action,
  cancelHref = "/admin/events",
}: {
  event?: EventValues;
  action: (
    state: EventActionState,
    formData: FormData
  ) => Promise<EventActionState>;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const defaults: EventValues = event ?? {
    title: "",
    description: "",
    venue: "",
    startsAt: "",
    endsAt: "",
    capacity: 0,
    visibility: "public",
    status: "draft",
  };

  const error = (field: keyof EventValues) => state.errors?.[field]?.[0];

  return (
    <form action={formAction} aria-busy={pending} className="space-y-5">
      {state.message ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Unable to save</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="shadow-none">
        <CardHeader className="border-b pb-5">
          <CardTitle className="font-display text-2xl">Event details</CardTitle>
          <CardDescription>
            The information guests see first on the public event page.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 pt-1">
          <Field id="title" label="Title" error={error("title")} required>
            <Input
              id="title"
              name="title"
              required
              maxLength={200}
              defaultValue={defaults.title}
              aria-invalid={Boolean(error("title"))}
              aria-describedby={error("title") ? "title-error" : undefined}
              placeholder="An evening worth showing up for"
            />
          </Field>
          <Field
            id="description"
            label="Description"
            description="Give guests the context, format, and details they need."
          >
            <Textarea
              id="description"
              name="description"
              rows={7}
              defaultValue={defaults.description}
              placeholder="What should guests expect?"
            />
          </Field>
          <Field id="venue" label="Venue">
            <Input
              id="venue"
              name="venue"
              defaultValue={defaults.venue}
              placeholder="Studio, address, or online"
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="border-b pb-5">
          <CardTitle className="font-display text-2xl">Schedule</CardTitle>
          <CardDescription>
            Times are currently entered and displayed in UTC.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 pt-1 sm:grid-cols-2">
          <Field id="startsAt" label="Starts at" error={error("startsAt")} required>
            <Input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={defaults.startsAt}
              aria-invalid={Boolean(error("startsAt"))}
              aria-describedby={error("startsAt") ? "startsAt-error" : undefined}
            />
          </Field>
          <Field id="endsAt" label="Ends at" error={error("endsAt")} required>
            <Input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              required
              defaultValue={defaults.endsAt}
              aria-invalid={Boolean(error("endsAt"))}
              aria-describedby={error("endsAt") ? "endsAt-error" : undefined}
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="border-b pb-5">
          <CardTitle className="font-display text-2xl">Registration</CardTitle>
          <CardDescription>
            Control availability and how the event is shared.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 pt-1 sm:grid-cols-3">
          <Field
            id="capacity"
            label="Capacity"
            description="Use 0 for unlimited."
            error={error("capacity")}
          >
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={0}
              defaultValue={defaults.capacity}
              aria-invalid={Boolean(error("capacity"))}
              aria-describedby={
                error("capacity") ? "capacity-error" : "capacity-description"
              }
            />
          </Field>
          <Field
            id="visibility"
            label="Visibility"
            description="Unlisted events stay off public directories."
          >
            <NativeSelect
              id="visibility"
              name="visibility"
              defaultValue={defaults.visibility}
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
            </NativeSelect>
          </Field>
          <Field
            id="status"
            label="Status"
            description="Only published events accept RSVPs."
          >
            <NativeSelect id="status" name="status" defaultValue={defaults.status}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
            </NativeSelect>
          </Field>
        </CardContent>
      </Card>

      <div className="sticky bottom-3 z-20 flex flex-col-reverse gap-2 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-end">
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending} className="sm:min-w-32">
          {pending ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              Saving
            </>
          ) : (
            <>
              <Eye aria-hidden="true" />
              Save event
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  description,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid content-start gap-2">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
        {required ? <span className="ml-1 text-primary">*</span> : null}
      </Label>
      {children}
      {description ? (
        <p id={`${id}-description`} className="text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
