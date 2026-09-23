import { redirect } from "next/navigation";
import { AdminNav } from "@/components/layout/admin-nav";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen lg:pl-68">
      <a
        href="#admin-content"
        className="fixed top-3 left-3 z-50 -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <AdminNav email={user.email} />
      <main
        id="admin-content"
        className="mx-auto w-full max-w-[96rem] px-4 py-7 sm:px-7 sm:py-10 lg:px-10"
      >
        {children}
      </main>
      <Toaster />
    </div>
  );
}
