"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
];

function NavLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="grid gap-1.5">
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin" ? pathname === href : pathname.startsWith(href);
        const link = (
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );

        return mobile ? (
          <SheetClose asChild key={href}>
            {link}
          </SheetClose>
        ) : (
          <div key={href}>{link}</div>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="inline-flex flex-col leading-none">
      <span className="font-display text-2xl font-medium tracking-[-0.03em]">
        Luma Alt
      </span>
      <span className="mt-1 text-[0.6rem] font-semibold tracking-[0.22em] text-sidebar-foreground/45 uppercase">
        Event office
      </span>
    </Link>
  );
}

function Account({ email }: { email: string }) {
  return (
    <div className="border-t border-sidebar-border pt-4">
      <p className="truncate text-xs text-sidebar-foreground/55">Signed in as</p>
      <p className="mt-1 truncate text-sm font-medium text-sidebar-foreground">
        {email}
      </p>
      <form action="/api/auth/logout" method="post" className="mt-3">
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut aria-hidden="true" />
          Sign out
        </Button>
      </form>
    </div>
  );
}

export function AdminNav({ email }: { email: string }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <Link
          href="/admin/events/new"
          className={cn(
            buttonVariants(),
            "mt-8 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          )}
        >
          <Plus aria-hidden="true" />
          New event
        </Link>
        <div className="mt-7">
          <NavLinks />
        </div>
        <div className="mt-auto">
          <Account email={email} />
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground lg:hidden">
        <Brand />
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Open navigation"
            >
              <Menu aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(22rem,88vw)] border-sidebar-border bg-sidebar text-sidebar-foreground"
          >
            <SheetHeader className="border-b border-sidebar-border px-5 py-6 text-left">
              <SheetTitle className="text-sidebar-foreground">
                <Brand />
              </SheetTitle>
              <SheetDescription className="sr-only">
                Admin navigation
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col px-4 py-5">
              <SheetClose asChild>
                <Link
                  href="/admin/events/new"
                  className={cn(
                    buttonVariants(),
                    "mb-6 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                  )}
                >
                  <Plus aria-hidden="true" />
                  New event
                </Link>
              </SheetClose>
              <NavLinks mobile />
              <div className="mt-auto">
                <Account email={email} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
