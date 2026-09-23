"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RsvpForm({ eventId }: { eventId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "ok" || status === "err") resultRef.current?.focus();
  }, [status]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setMessage(null);

    try {
      const response = await fetch(`/api/rsvp/${eventId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      setStatus("ok");
      setMessage(
        data.duplicate
          ? `You are already registered as ${email}.`
          : `Your place is saved for ${email}.`
      );
    } catch (requestError) {
      setStatus("err");
      setMessage(
        requestError instanceof Error ? requestError.message : "Something went wrong."
      );
    }
  }

  if (status === "ok") {
    return (
      <div ref={resultRef} tabIndex={-1}>
        <div className="rounded-lg border border-success/25 bg-success/5 p-5">
          <CheckCircle2 className="size-7 text-success" aria-hidden="true" />
          <h3 className="mt-4 font-display text-2xl font-medium">You are on the list</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="rsvp-name" className="font-semibold">
          Your name
        </Label>
        <Input
          id="rsvp-name"
          name="name"
          autoComplete="name"
          placeholder="Full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="rsvp-email" className="font-semibold">
          Email address
        </Label>
        <Input
          id="rsvp-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <Button type="submit" size="lg" disabled={status === "sending"} className="mt-1 w-full">
        {status === "sending" ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Saving your place
          </>
        ) : (
          "RSVP"
        )}
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        We use your details only to manage this event.
      </p>
      {status === "err" && message ? (
        <div ref={resultRef} tabIndex={-1}>
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>Registration failed</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </div>
      ) : null}
    </form>
  );
}
