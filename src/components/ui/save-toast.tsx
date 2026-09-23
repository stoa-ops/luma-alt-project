"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function SaveToast({ state }: { state?: string }) {
  useEffect(() => {
    if (state === "created") toast.success("Event created");
    if (state === "updated") toast.success("Changes saved");
    if (state) window.history.replaceState(null, "", window.location.pathname);
  }, [state]);

  return null;
}
