"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/session";

const EventInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().default(""),
  venue: z.string().default(""),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Enter a start date and time."),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Enter an end date and time."),
  capacity: z.coerce.number().int().min(0).default(0),
  visibility: z.enum(["public", "unlisted"]).default("public"),
  status: z.enum(["draft", "published", "cancelled"]).default("draft"),
});

export type EventActionState = {
  message?: string;
  errors?: Record<string, string[]>;
};

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "event"
  );
}

async function uniqueSlug(title: string) {
  const base = slugify(title);
  for (let i = 0; i < 10; i++) {
    const candidate = i === 0 ? base : `${base}-${randomBytes(2).toString("hex")}`;
    const existing = await db
      .select({ slug: schema.events.slug })
      .from(schema.events)
      .where(eq(schema.events.slug, candidate));
    if (existing.length === 0) return candidate;
  }
  return `${base}-${randomBytes(4).toString("hex")}`;
}

function parseEvent(formData: FormData):
  | { data: z.infer<typeof EventInput> & { startsAtDate: Date; endsAtDate: Date } }
  | EventActionState {
  const parsed = EventInput.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    venue: formData.get("venue") ?? "",
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    capacity: formData.get("capacity") ?? 0,
    visibility: formData.get("visibility") ?? "public",
    status: formData.get("status") ?? "draft",
  });

  if (!parsed.success) {
    return {
      message: "Check the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const startsAtDate = new Date(`${parsed.data.startsAt}:00Z`);
  const endsAtDate = new Date(`${parsed.data.endsAt}:00Z`);
  if (endsAtDate <= startsAtDate) {
    return {
      message: "Check the highlighted fields.",
      errors: { endsAt: ["End time must be after the start time."] },
    };
  }

  return { data: { ...parsed.data, startsAtDate, endsAtDate } };
}

export async function createEvent(
  _previousState: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Your session expired. Sign in and try again." };

  const parsed = parseEvent(formData);
  if (!("data" in parsed)) return parsed;

  const { startsAtDate, endsAtDate, ...values } = parsed.data;
  const slug = await uniqueSlug(values.title);

  const [row] = await db
    .insert(schema.events)
    .values({
      ...values,
      startsAt: startsAtDate,
      endsAt: endsAtDate,
      slug,
      createdBy: user.id,
    })
    .returning();

  revalidatePath("/admin");
  revalidatePath("/admin/events");
  redirect(`/admin/events/${row.id}?saved=created`);
}

export async function updateEvent(
  id: string,
  _previousState: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Your session expired. Sign in and try again." };

  const parsed = parseEvent(formData);
  if (!("data" in parsed)) return parsed;
  const { startsAtDate, endsAtDate, ...values } = parsed.data;

  await db
    .update(schema.events)
    .set({
      ...values,
      startsAt: startsAtDate,
      endsAt: endsAtDate,
    })
    .where(eq(schema.events.id, id));

  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/admin/events");
  redirect(`/admin/events/${id}?saved=updated`);
}
