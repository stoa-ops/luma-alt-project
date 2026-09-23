"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import {
  type ColumnDef,
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ArrowDownUp, ExternalLink, Pencil, Search } from "lucide-react";
import {
  EventStatusBadge,
  VisibilityBadge,
} from "@/components/events/event-badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/components/ui/date-time";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type EventTableRow = {
  id: string;
  title: string;
  status: "draft" | "published" | "cancelled";
  visibility: "public" | "unlisted";
  startsAt: string;
  venue: string;
  slug: string;
};

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    text: sortFn_text,
    datetime: sortFn_datetime,
  },
});

const column = createColumnHelper<typeof features, EventTableRow>();

const columns = [
  column.accessor("title", {
    header: "Event",
    sortFn: "text",
    cell: ({ row }) => (
      <div className="min-w-52">
        <Link
          href={`/admin/events/${row.original.id}`}
          className="font-semibold hover:text-primary hover:underline hover:underline-offset-4"
        >
          {row.original.title}
        </Link>
        <p className="mt-1 max-w-64 truncate text-xs text-muted-foreground">
          {row.original.venue || "Venue not set"}
        </p>
      </div>
    ),
  }),
  column.accessor("status", {
    header: "Status",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1.5">
        <EventStatusBadge status={row.original.status} />
        <VisibilityBadge visibility={row.original.visibility} />
      </div>
    ),
  }),
  column.accessor("startsAt", {
    header: "Starts",
    sortFn: "datetime",
    cell: ({ getValue }) => (
      <time dateTime={getValue()}>{formatDateTime(getValue())}</time>
    ),
  }),
  column.accessor("slug", {
    header: "Public link",
    cell: ({ getValue }) => (
      <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
        /e/{getValue()}
      </code>
    ),
  }),
  column.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button asChild variant="ghost" size="icon-sm">
          <Link href={`/e/${row.original.slug}`} aria-label={`View ${row.original.title}`}>
            <ExternalLink aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon-sm">
          <Link
            href={`/admin/events/${row.original.id}`}
            aria-label={`Edit ${row.original.title}`}
          >
            <Pencil aria-hidden="true" />
          </Link>
        </Button>
      </div>
    ),
  }),
] as ColumnDef<typeof features, EventTableRow>[];

export function EventsTable({ data }: { data: EventTableRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const filtered = data.filter((event) => {
    const matchesQuery =
      !deferredQuery ||
      event.title.toLowerCase().includes(deferredQuery) ||
      event.venue.toLowerCase().includes(deferredQuery) ||
      event.slug.toLowerCase().includes(deferredQuery);
    return matchesQuery && (status === "all" || event.status === status);
  });

  const table = useTable({ features, columns, data: filtered });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search events</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events, venues, or links"
            className="pl-9"
          />
        </label>
        <label className="sm:w-44">
          <span className="sr-only">Filter by status</span>
          <NativeSelect value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
          </NativeSelect>
        </label>
      </div>

      <Card className="hidden overflow-hidden py-0 shadow-none md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1.5 hover:text-primary"
                      >
                        <table.FlexRender header={header} />
                        <ArrowDownUp className="size-3.5" aria-hidden="true" />
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-4 last:text-right">
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid gap-3 md:hidden">
        {table.getRowModel().rows.map((row) => {
          const event = row.original;
          return (
            <Card key={event.id} className="gap-4 p-4 shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="font-semibold hover:text-primary"
                  >
                    {event.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(event.startsAt)}
                  </p>
                </div>
                <EventStatusBadge status={event.status} />
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <VisibilityBadge visibility={event.visibility} />
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/events/${event.id}`}>
                    <Pencil aria-hidden="true" />
                    Edit
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {table.getRowModel().rows.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center">
          <p className="font-display text-2xl">No matching events</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different search or status filter.
          </p>
        </div>
      ) : null}
    </div>
  );
}
