const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

export function DateTime({ value }: { value: Date | string }) {
  const date = new Date(value);
  return <time dateTime={date.toISOString()}>{formatter.format(date)}</time>;
}

export function formatDateTime(value: Date | string) {
  return formatter.format(new Date(value));
}
