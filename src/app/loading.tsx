import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 sm:px-7">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-6 h-16 w-full max-w-2xl" />
      <Skeleton className="mt-4 h-5 w-full max-w-lg" />
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </main>
  );
}
