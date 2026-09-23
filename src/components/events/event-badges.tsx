import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles = {
  draft: "border-warning/25 bg-warning/10 text-warning",
  published: "border-success/25 bg-success/10 text-success",
  cancelled: "border-destructive/25 bg-destructive/10 text-destructive",
};

export function EventStatusBadge({
  status,
}: {
  status: "draft" | "published" | "cancelled";
}) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", statusStyles[status])}
    >
      {status}
    </Badge>
  );
}

export function VisibilityBadge({
  visibility,
}: {
  visibility: "public" | "unlisted";
}) {
  return (
    <Badge variant="outline" className="capitalize text-muted-foreground">
      {visibility}
    </Badge>
  );
}
