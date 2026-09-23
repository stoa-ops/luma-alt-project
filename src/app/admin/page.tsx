import Link from "next/link";
import { and, count, desc, eq, gt } from "drizzle-orm";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Plus,
  TicketCheck,
} from "lucide-react";
import { EventStatusBadge } from "@/components/events/event-badges";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateTime } from "@/components/ui/date-time";
import { EmptyState } from "@/components/ui/empty-state";
import { db, schema } from "@/lib/db/client";

export default async function AdminDashboard() {
  const [events, eventCountRows, publishedRows, upcomingRows, attendeeRows] =
    await Promise.all([
      db
        .select()
        .from(schema.events)
        .orderBy(desc(schema.events.createdAt))
        .limit(6),
      db.select({ value: count() }).from(schema.events),
      db
        .select({ value: count() })
        .from(schema.events)
        .where(eq(schema.events.status, "published")),
      db
        .select({ value: count() })
        .from(schema.events)
        .where(
          and(
            eq(schema.events.status, "published"),
            gt(schema.events.startsAt, new Date())
          )
        ),
      db
        .select({ value: count(schema.attendees.id) })
        .from(schema.attendees)
        .innerJoin(schema.orders, eq(schema.attendees.orderId, schema.orders.id))
        .where(eq(schema.orders.status, "paid")),
    ]);

  const stats = [
    {
      label: "Total events",
      value: eventCountRows[0]?.value ?? 0,
      icon: CalendarDays,
    },
    {
      label: "Published",
      value: publishedRows[0]?.value ?? 0,
      icon: CheckCircle2,
    },
    {
      label: "Upcoming",
      value: upcomingRows[0]?.value ?? 0,
      icon: ArrowUpRight,
    },
    {
      label: "Confirmed guests",
      value: attendeeRows[0]?.value ?? 0,
      icon: TicketCheck,
    },
  ];

  return (
    <div className="space-y-9">
      <PageHeader
        eyebrow="Event office"
        title="Dashboard"
        description="A clear view of what is live, what is next, and who is coming."
        actions={
          <Button asChild className="lg:hidden">
            <Link href="/admin/events/new">
              <Plus aria-hidden="true" />
              New event
            </Link>
          </Button>
        }
      />

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Overview
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-border/80 shadow-none">
              <CardHeader className="flex-row items-center justify-between">
                <CardDescription className="font-medium">{label}</CardDescription>
                <Icon className="size-4 text-primary" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <p className="font-display text-4xl font-medium tracking-[-0.03em]">
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-events-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              Latest activity
            </p>
            <h2
              id="recent-events-heading"
              className="mt-1 font-display text-3xl font-medium"
            >
              Recent events
            </h2>
          </div>
          {events.length > 0 ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/events">
                View all
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="size-5" aria-hidden="true" />}
            title="Your calendar is wide open"
            description="Create your first event to publish a page and start collecting registrations."
            action={
              <Button asChild>
                <Link href="/admin/events/new">Create an event</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/35 hover:bg-card/75 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold group-hover:text-primary">
                      {event.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <DateTime value={event.startsAt} />
                    </p>
                    {event.venue ? (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {event.venue}
                      </p>
                    ) : null}
                  </div>
                  <EventStatusBadge status={event.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
