"use client";

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
import { ArrowDownUp, Search, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export type AttendeeTableRow = {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  checkedInAt: string | null;
};

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    text: sortFn_text,
    datetime: sortFn_datetime,
  },
});

const column = createColumnHelper<typeof features, AttendeeTableRow>();
const columns = [
  column.accessor("name", {
    header: "Guest",
    sortFn: "text",
    cell: ({ row }) => (
      <div className="min-w-52">
        <p className="font-semibold">{row.original.name}</p>
        <p className="mt-1 max-w-72 truncate text-xs text-muted-foreground">
          {row.original.email}
        </p>
      </div>
    ),
  }),
  column.accessor("registeredAt", {
    header: "Registered",
    sortFn: "datetime",
    cell: ({ getValue }) => (
      <time dateTime={getValue()}>{formatDateTime(getValue())}</time>
    ),
  }),
  column.accessor("checkedInAt", {
    header: "Check-in",
    cell: ({ getValue }) =>
      getValue() ? (
        <Badge variant="outline" className="border-success/25 bg-success/10 text-success">
          Checked in
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">
          Not checked in
        </Badge>
      ),
  }),
] as ColumnDef<typeof features, AttendeeTableRow>[];

export function AttendeesTable({ data }: { data: AttendeeTableRow[] }) {
  const [query, setQuery] = useState("");
  const [checkIn, setCheckIn] = useState("all");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const filtered = data.filter((attendee) => {
    const matchesQuery =
      !deferredQuery ||
      attendee.name.toLowerCase().includes(deferredQuery) ||
      attendee.email.toLowerCase().includes(deferredQuery);
    const matchesCheckIn =
      checkIn === "all" ||
      (checkIn === "checked-in" && attendee.checkedInAt) ||
      (checkIn === "not-checked-in" && !attendee.checkedInAt);
    return matchesQuery && matchesCheckIn;
  });
  const table = useTable({ features, columns, data: filtered });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search attendees</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            className="pl-9"
          />
        </label>
        <label className="sm:w-48">
          <span className="sr-only">Filter by check-in status</span>
          <NativeSelect value={checkIn} onChange={(event) => setCheckIn(event.target.value)}>
            <option value="all">All guests</option>
            <option value="checked-in">Checked in</option>
            <option value="not-checked-in">Not checked in</option>
          </NativeSelect>
        </label>
      </div>

      <Card className="hidden overflow-hidden py-0 shadow-none md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
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
                  <TableCell key={cell.id} className="px-4 py-4">
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
          const attendee = row.original;
          return (
            <Card key={attendee.id} className="gap-4 p-4 shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{attendee.name}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {attendee.email}
                  </p>
                </div>
                {attendee.checkedInAt ? (
                  <Badge variant="outline" className="border-success/25 bg-success/10 text-success">
                    Checked in
                  </Badge>
                ) : null}
              </div>
              <p className="border-t pt-3 text-xs text-muted-foreground">
                Registered {formatDateTime(attendee.registeredAt)}
              </p>
            </Card>
          );
        })}
      </div>

      {table.getRowModel().rows.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center">
          <UserCheck className="mx-auto size-5 text-primary" aria-hidden="true" />
          <p className="mt-4 font-display text-2xl">No matching guests</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different search or check-in filter.
          </p>
        </div>
      ) : null}
    </div>
  );
}
