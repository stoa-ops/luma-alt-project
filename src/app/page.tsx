import Link from "next/link";
import { connection } from "next/server";
import { and, asc, eq, gt } from "drizzle-orm";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateTime } from "@/components/ui/date-time";
import { db, schema } from "@/lib/db/client";

export default async function Home() {
  await connection();
  const events = await db
    .select()
    .from(schema.events)
    .where(
      and(
        eq(schema.events.status, "published"),
        eq(schema.events.visibility, "public"),
        gt(schema.events.startsAt, new Date())
      )
    )
    .orderBy(asc(schema.events.startsAt))
    .limit(6);

  return (
    <main className="min-h-screen">
      <header className="border-b border-foreground/10">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-7">
          <Link href="/" className="font-display text-2xl font-medium tracking-[-0.03em]">
            Luma Alt
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">
              Admin sign in
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-foreground/10">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:min-h-[34rem] lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-3xl px-4 pt-20 pb-10 sm:px-7 lg:flex lg:flex-col lg:justify-center lg:py-24 lg:pr-0">
              <p className="mb-5 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                Independent events, thoughtfully run
              </p>
              <h1 className="text-balance font-display text-6xl leading-[0.88] font-medium tracking-[-0.055em] sm:text-7xl lg:text-[6.75rem]">
                Make the gathering the main event.
              </h1>
              <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
                A focused place to discover, organize, and join the events that bring
                our community together.
              </p>
            </div>
            <div className="relative px-4 pb-20 sm:px-7 lg:flex lg:flex-col lg:justify-center lg:py-24">
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 right-[-100vw] hidden bg-primary lg:block"
              />
              <div className="relative z-10 mt-6 border border-foreground/20 p-7 text-foreground lg:mt-0 lg:ml-auto lg:w-[88%] lg:border-primary-foreground/30 lg:text-primary-foreground">
                <p className="font-display text-4xl leading-tight">
                  Fewer platforms.
                  <br />
                  Better rooms.
                </p>
                <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground lg:text-primary-foreground/70">
                  Built for real gatherings, from the first invitation to the final
                  check-in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-7 sm:py-24">
        <div className="mb-9 flex items-end justify-between gap-4 border-b pb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              On the calendar
            </p>
            <h2 className="mt-2 font-display text-4xl font-medium sm:text-5xl">
              Upcoming events
            </h2>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/50 px-6 py-20 text-center">
            <CalendarDays className="mx-auto size-6 text-primary" aria-hidden="true" />
            <h3 className="mt-5 font-display text-3xl font-medium">
              The next date is taking shape
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Check back soon for the next gathering.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event, index) => (
              <Link
                key={event.id}
                href={`/e/${event.slug}`}
                className="group flex min-h-64 flex-col rounded-xl border bg-card p-6 transition-colors hover:border-primary/35 hover:bg-[#faf5eb] focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    Event {String(index + 1).padStart(2, "0")}
                  </span>
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-9 text-balance font-display text-3xl leading-tight font-medium group-hover:text-primary">
                  {event.title}
                </h3>
                <div className="mt-auto space-y-2 pt-8 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                    <DateTime value={event.startsAt} />
                  </p>
                  {event.venue ? (
                    <p className="flex items-center gap-2">
                      <MapPin className="size-4 text-primary" aria-hidden="true" />
                      {event.venue}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p>Luma Alt. Events, on your terms.</p>
          <Link href="/login" className="font-semibold text-foreground hover:text-primary">
            Event office
          </Link>
        </div>
      </footer>
    </main>
  );
}
