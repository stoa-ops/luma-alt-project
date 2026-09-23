import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
};

type Search = Promise<{ error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: Search }) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative hidden overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col">
        <Link href="/" className="font-display text-2xl font-medium tracking-[-0.03em]">
          Luma Alt
        </Link>
        <div className="my-auto max-w-xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-sidebar-primary uppercase">
            Event office
          </p>
          <h1 className="mt-5 text-balance font-display text-6xl leading-[0.94] font-medium tracking-[-0.04em]">
            Behind every good gathering is a calm control room.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-sidebar-foreground/60">
            Plan, publish, and manage every guest from one deliberately simple
            workspace.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/35">Private administrator access</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-12 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to events
          </Link>
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Welcome back
          </p>
          <h2 className="mt-3 font-display text-5xl font-medium tracking-[-0.03em]">
            Sign in
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Enter your approved administrator email. We will send a secure link
            that expires in 15 minutes.
          </p>
          <div className="mt-8">
            <LoginForm error={error} />
          </div>
          <p className="mt-8 text-xs leading-5 text-muted-foreground">
            Access is limited to approved team members. No password required.
          </p>
        </div>
      </section>
    </main>
  );
}
