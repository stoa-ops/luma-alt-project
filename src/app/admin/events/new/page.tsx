import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { createEvent } from "../actions";
import { EventForm } from "../event-form";

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/admin/events">
          <ArrowLeft aria-hidden="true" />
          Events
        </Link>
      </Button>
      <PageHeader
        eyebrow="New event"
        title="Set the scene"
        description="Start with the essentials. You can keep the event private until every detail is ready."
      />
      <EventForm action={createEvent} />
    </div>
  );
}
