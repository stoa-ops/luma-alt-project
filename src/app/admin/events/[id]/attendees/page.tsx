import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft, Pencil, UserCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { db, schema } from "@/lib/db/client";
import {
  AttendeesTable,
  type AttendeeTableRow,
} from "./attendees-table";

export default async function AttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.id, id))
    .limit(1);
  if (!event) notFound();

  const attendees = await db
    .select({
      id: schema.attendees.id,
      name: schema.attendees.name,
      email: schema.attendees.email,
      checkedInAt: schema.attendees.checkedInAt,
      orderCreatedAt: schema.orders.createdAt,
    })
    .from(schema.attendees)
    .innerJoin(schema.orders, eq(schema.attendees.orderId, schema.orders.id))
    .where(eq(schema.orders.eventId, id))
    .orderBy(desc(schema.orders.createdAt));

  const rows: AttendeeTableRow[] = attendees.map((attendee) => ({
    id: attendee.id,
    name: attendee.name,
    email: attendee.email,
    registeredAt: attendee.orderCreatedAt.toISOString(),
    checkedInAt: attendee.checkedInAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href={`/admin/events/${id}`}>
          <ArrowLeft aria-hidden="true" />
          {event.title}
        </Link>
      </Button>
      <PageHeader
        eyebrow="Guest list"
        title="Attendees"
        description={`${attendees.length} confirmed ${attendees.length === 1 ? "guest" : "guests"} for ${event.title}.`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/admin/events/${id}`}>
              <Pencil aria-hidden="true" />
              Edit event
            </Link>
          </Button>
        }
      />

      {attendees.length === 0 ? (
        <EmptyState
          icon={<UserCheck className="size-5" aria-hidden="true" />}
          title="No guests yet"
          description="Registrations will appear here as soon as people RSVP to the event."
          action={
            <Button asChild variant="outline">
              <Link href={`/e/${event.slug}`}>View public event</Link>
            </Button>
          }
        />
      ) : (
        <AttendeesTable data={rows} />
      )}
    </div>
  );
}
