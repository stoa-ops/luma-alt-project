import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-16">
      <div className="max-w-lg text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
          <SearchX className="size-5" aria-hidden="true" />
        </div>
        <p className="mt-7 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          404
        </p>
        <h1 className="mt-3 text-balance font-display text-5xl font-medium tracking-[-0.03em]">
          This event has left the room.
        </h1>
        <p className="mt-4 text-pretty text-sm leading-6 text-muted-foreground">
          The page may have moved, the event may be private, or the link may no
          longer be available.
        </p>
        <Button asChild className="mt-7">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Back to events
          </Link>
        </Button>
      </div>
    </main>
  );
}
