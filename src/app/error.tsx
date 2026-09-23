"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-16">
      <div className="max-w-lg text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <CircleAlert className="size-5" aria-hidden="true" />
        </div>
        <p className="mt-7 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          Something went wrong
        </p>
        <h1 className="mt-3 text-balance font-display text-5xl font-medium tracking-[-0.03em]">
          We lost the thread for a moment.
        </h1>
        <p className="mt-4 text-pretty text-sm leading-6 text-muted-foreground">
          Your information is safe. Try loading this view again.
        </p>
        <Button type="button" onClick={reset} className="mt-7">
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
      </div>
    </main>
  );
}
