import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { schema, withTransaction } from "@/lib/db/client";

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().transform((value) => value.trim().toLowerCase()),
});

type RegistrationResult =
  | "registered"
  | "duplicate"
  | "not-found"
  | "closed"
  | "sold-out";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  if (!z.uuid().safeParse(eventId).success) {
    return NextResponse.json(
      { ok: false, error: "Event not found." },
      { status: 404 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }
  const { name, email } = parsed.data;

  try {
    const result = await withTransaction<RegistrationResult>(async (tx) => {
      const [event] = await tx
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, eventId))
        .limit(1)
        .for("update");
      if (!event) return "not-found";
      if (event.status !== "published" || event.startsAt <= new Date()) {
        return "closed";
      }

      const [existing] = await tx
        .select({ id: schema.attendees.id })
        .from(schema.attendees)
        .innerJoin(schema.orders, eq(schema.attendees.orderId, schema.orders.id))
        .where(
          and(
            eq(schema.orders.eventId, event.id),
            eq(schema.attendees.email, email)
          )
        )
        .limit(1);
      if (existing) return "duplicate";

      if (event.capacity > 0) {
        const [registrationCount] = await tx
          .select({ value: count(schema.attendees.id) })
          .from(schema.attendees)
          .innerJoin(schema.orders, eq(schema.attendees.orderId, schema.orders.id))
          .where(
            and(
              eq(schema.orders.eventId, event.id),
              eq(schema.orders.status, "paid")
            )
          );
        if (registrationCount.value >= event.capacity) return "sold-out";
      }

      const [order] = await tx
        .insert(schema.orders)
        .values({
          eventId: event.id,
          status: "paid",
          buyerEmail: email,
          buyerName: name,
          subtotalCents: 0,
          feeCents: 0,
          totalCents: 0,
        })
        .returning();

      await tx.insert(schema.attendees).values({
        orderId: order.id,
        ticketTypeId: null,
        name,
        email,
        qrToken: randomBytes(24).toString("hex"),
      });

      return "registered";
    });

    if (result === "not-found") {
      return NextResponse.json(
        { ok: false, error: "Event not found." },
        { status: 404 }
      );
    }
    if (result === "closed") {
      return NextResponse.json(
        { ok: false, error: "RSVPs are closed." },
        { status: 409 }
      );
    }
    if (result === "sold-out") {
      return NextResponse.json(
        { ok: false, error: "This event is sold out." },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true, duplicate: result === "duplicate" });
  } catch (error) {
    console.error("Unable to create RSVP", error);
    return NextResponse.json(
      { ok: false, error: "Unable to save your RSVP. Try again." },
      { status: 500 }
    );
  }
}
