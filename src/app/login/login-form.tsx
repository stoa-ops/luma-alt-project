"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, CircleAlert, FlaskConical, LoaderCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ error }: { error?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [link, setLink] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "sent" || status === "error") statusRef.current?.focus();
  }, [status]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setMessage(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to send sign-in link.");

      setLink(data.devUrl ?? null);
      setMessage("If that address is approved, its sign-in link is on the way.");
      setStatus("sent");
    } catch (requestError) {
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Unable to send sign-in link."
      );
      setStatus("error");
    }
  }

  const href = link ? link.replace("http://localhost:3000", "") : "#";
  const callbackError =
    error === "invalid"
      ? "That sign-in link is invalid or expired. Request a fresh one below."
      : error === "missing"
        ? "That sign-in link is incomplete. Request a fresh one below."
        : null;

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      {callbackError ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Sign-in link unavailable</AlertTitle>
          <AlertDescription>{callbackError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="email" className="font-semibold">
          Email address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={status === "error"}
        />
      </div>

      <Button type="submit" size="lg" disabled={status === "sending"}>
        {status === "sending" ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden="true" />
            Sending link
          </>
        ) : (
          <>
            Send magic link
            <ArrowRight aria-hidden="true" />
          </>
        )}
      </Button>

      {message ? (
        <div ref={statusRef} tabIndex={-1}>
          <Alert variant={status === "error" ? "destructive" : "default"}>
            {status === "error" ? (
              <CircleAlert aria-hidden="true" />
            ) : (
              <CheckCircle2 className="text-success" aria-hidden="true" />
            )}
            <AlertTitle>{status === "error" ? "Something went wrong" : "Check your inbox"}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {link ? (
        <Alert className="border-warning/25 bg-warning/5">
          <FlaskConical className="text-warning" aria-hidden="true" />
          <AlertTitle>Development mode</AlertTitle>
          <AlertDescription>
            Email delivery is bypassed locally. <a href={href}>Open the sign-in link</a>.
          </AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
