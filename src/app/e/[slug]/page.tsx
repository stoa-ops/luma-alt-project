import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { and, count, eq } from "drizzle-orm";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";
import { notFound } from "next/navigation";
import { EventStatusBadge } from "@/components/events/event-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db/client";
import { RsvpForm } from "./rsvp-form";

const getEvent = cache(async (slug: string) => {
  const [event] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.slug, slug))
    .limit(1);
  return event ?? null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event || event.status !== "published") return { title: "Event" };

  const description =
    event.description.slice(0, 155) || `Join us for ${event.title}.`;

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "website",
      images: event.coverUrl ? [event.coverUrl] : undefined,
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const user = event.status === "published" ? null : await getCurrentUser();
  if (event.status !== "published" && !user) notFound();

  const [attendeeCount] = await db
    .select({ value: count(schema.attendees.id) })
    .from(schema.attendees)
    .innerJoin(schema.orders, eq(schema.attendees.orderId, schema.orders.id))
    .where(
      and(
        eq(schema.orders.eventId, event.id),
        eq(schema.orders.status, "paid")
      )
    );
  const registrations = attendeeCount?.value ?? 0;
  const soldOut = event.capacity > 0 && registrations >= event.capacity;
  const started = event.startsAt <= new Date();
  const rsvpsOpen = event.status === "published" && !started && !soldOut;

  const day = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    timeZone: "UTC",
  }).format(event.startsAt);
  const month = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(event.startsAt);
  const dateRange = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(event.startsAt);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

  return (
    <main className="min-h-screen">
      {user ? (
        <div className="border-b border-warning/25 bg-warning/10 px-4 py-2.5 text-center text-xs font-semibold text-warning">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Admin preview. This {event.status} event is hidden from guests.
          </span>
        </div>
      ) : null}

      <header className="border-b border-foreground/10">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-7">
          <Link href="/" className="font-display text-2xl font-medium tracking-[-0.03em]">
            Luma Alt
          </Link>
          {user ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/admin/events/${event.id}`}>
                <ArrowLeft aria-hidden="true" />
                Back to editor
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      <article>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-7 sm:py-16">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_26rem]">
            <div className="min-w-0">
              <div className="flex items-start gap-5 sm:gap-7">
                <div className="flex w-16 shrink-0 flex-col overflow-hidden rounded-lg border bg-card text-center shadow-sm sm:w-20">
                  <span className="bg-primary px-2 py-1.5 text-[0.65rem] font-bold tracking-[0.14em] text-primary-foreground uppercase">
                    {month}
                  </span>
                  <span className="font-display text-3xl leading-12 font-medium sm:text-4xl sm:leading-14">
                    {day}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <EventStatusBadge status={event.status} />
                    {event.visibility === "unlisted" ? (
                      <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Unlisted
                      </span>
                    ) : null}
                  </div>
                  <h1 className="text-balance font-display text-5xl leading-[0.98] font-medium tracking-[-0.045em] sm:text-7xl lg:text-8xl">
                    {event.title}
                  </h1>
                </div>
              </div>

              {event.coverUrl ? (
                <img
                  src={event.coverUrl}
                  alt={`${event.title} cover`}
                  className="mt-10 aspect-[16/9] w-full rounded-xl object-cover"
                />
              ) : (
                <div className="mt-10 grid aspect-[16/7] place-items-center overflow-hidden rounded-xl bg-sidebar px-8 text-sidebar-foreground">
                  <p className="max-w-2xl text-center font-display text-4xl leading-tight text-sidebar-foreground/90 sm:text-6xl">
                    Come for the idea. Stay for the room.
                  </p>
                </div>
              )}

              <dl className="mt-10 grid gap-4 border-y py-6 sm:grid-cols-2">
                <div className="flex gap-3">
                  <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <dt className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      Date
                    </dt>
                    <dd className="mt-1 text-sm font-medium">{dateRange}</dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock3 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <dt className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      Time
                    </dt>
                    <dd className="mt-1 text-sm font-medium">
                      {time.format(event.startsAt)} to {time.format(event.endsAt)} UTC
                    </dd>
                  </div>
                </div>
                {event.venue ? (
                  <div className="flex gap-3 sm:col-span-2">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <dt className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                        Venue
                      </dt>
                      <dd className="mt-1 text-sm font-medium">{event.venue}</dd>
                    </div>
                  </div>
                ) : null}
              </dl>

              {event.description ? (
                <section className="mt-10 max-w-3xl">
                  <p className="mb-4 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                    About this event
                  </p>
                  <div className="whitespace-pre-wrap text-pretty text-lg leading-8 text-foreground/80">
                    {event.description}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-8">
              <Card className="gap-5 border-foreground/15 p-1 shadow-[0_18px_60px_rgba(39,32,24,0.09)]">
                <CardHeader>
                  <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                    Registration
                  </p>
                  <CardTitle className="font-display text-3xl">
                    {rsvpsOpen
                      ? "Save your place"
                      : soldOut
                        ? "The room is full"
                        : "Registration closed"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rsvpsOpen ? (
                    <RsvpForm eventId={event.id} />
                  ) : (
                    <div className="rounded-lg bg-muted p-5 text-sm leading-6 text-muted-foreground">
                      <TicketCheck className="mb-3 size-5 text-primary" aria-hidden="true" />
                      {soldOut
                        ? "This event has reached capacity."
                        : started
                          ? "This event has already started."
                          : "This event is not currently accepting registrations."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </article>
    </main>
  );
}
