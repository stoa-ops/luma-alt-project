import Link from "next/link";
import { desc } from "drizzle-orm";
import { CalendarDays, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { db, schema } from "@/lib/db/client";
import { EventsTable, type EventTableRow } from "./events-table";

export default async function EventsList() {
  const events = await db
    .select()
    .from(schema.events)
    .orderBy(desc(schema.events.createdAt));

  const rows: EventTableRow[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    status: event.status,
    visibility: event.visibility,
    startsAt: event.startsAt.toISOString(),
    venue: event.venue,
    slug: event.slug,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Program"
        title="Events"
        description="Create, publish, and keep every event moving from one place."
        actions={
          <Button asChild>
            <Link href="/admin/events/new">
              <Plus aria-hidden="true" />
              New event
            </Link>
          </Button>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-5" aria-hidden="true" />}
          title="No events yet"
          description="Start with the essentials. You can keep it private as a draft until it is ready."
          action={
            <Button asChild>
              <Link href="/admin/events/new">Create your first event</Link>
            </Button>
          }
        />
      ) : (
        <EventsTable data={rows} />
      )}
    </div>
  );
}
