import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SaveToast } from "@/components/ui/save-toast";
import { db, schema } from "@/lib/db/client";
import { updateEvent } from "../actions";
import { EventForm } from "../event-form";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const [event] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.id, id))
    .limit(1);
  if (!event) notFound();

  const bound = updateEvent.bind(null, id);
  const isoLocal = (date: Date) => new Date(date).toISOString().slice(0, 16);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <SaveToast state={saved} />
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/admin/events">
          <ArrowLeft aria-hidden="true" />
          Events
        </Link>
      </Button>
      <PageHeader
        eyebrow="Event workspace"
        title={event.title}
        description={`/e/${event.slug}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/admin/events/${event.id}/attendees`}>
                <Users aria-hidden="true" />
                Attendees
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/e/${event.slug}`} target="_blank">
                <ExternalLink aria-hidden="true" />
                Preview
              </Link>
            </Button>
          </>
        }
      />
      <EventForm
        action={bound}
        cancelHref="/admin/events"
        event={{
          title: event.title,
          description: event.description,
          venue: event.venue,
          startsAt: isoLocal(event.startsAt),
          endsAt: isoLocal(event.endsAt),
          capacity: event.capacity,
          visibility: event.visibility,
          status: event.status,
        }}
      />
    </div>
  );
}
