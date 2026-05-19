// app/dashboard/layout.tsx
// Server layout — ONLY does auth check + redirect. No DB queries.
// All audit counts / plan data are fetched client-side via Jotai atoms
// (see lib/state/user-limits.ts). This keeps the layout render time
// to ~10ms (cookie decode only) instead of 200-500ms blocking on DB.

import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { getCachedSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCachedSession();
  if (!session?.user?.id) redirect("/login");

  const plan = (session.user.plan || session.user.role || "FREE").toUpperCase();
  const userProps = {
    name:  session.user.name,
    email: session.user.email,
    plan,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar user={userProps} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardNavbar user={userProps} />

        <main className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
